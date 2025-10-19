import express from 'express'
import { auth } from '../middleware/auth.js'

// Importações condicionais para evitar erro quando DB não está configurado
let User = null
let mpCreateCheckout = null
let mpCreatePreapproval = null
let mpCancelPreapproval = null
let stripeCreateCheckout = null

try {
  User = (await import('../models/User.js')).default
  const mpController = await import('../controllers/paymentMPController.js')
  mpCreateCheckout = mpController.mpCreateCheckout
  mpCreatePreapproval = mpController.mpCreatePreapproval
  mpCancelPreapproval = mpController.mpCancelPreapproval
  const stripeController = await import('../controllers/paymentStripeController.js')
  stripeCreateCheckout = stripeController.stripeCreateCheckout
} catch (error) {
  console.warn('⚠️ Alguns módulos não puderam ser carregados (modo stub):', error.message)
}

const router = express.Router()

// Definição dos planos disponíveis
const PLANS = {
  trial: {
    id: 'trial',
    name: 'Trial Gratuito',
    description: '7 dias grátis para testar',
    price: 0,
    duration: 7, // dias
    features: [
      'Até 3 sinais por semana',
      'Acesso ao canal básico',
      'Suporte por email'
    ],
    limits: {
      signalsPerWeek: 3,
      historicalData: false,
      prioritySupport: false,
      vipGroup: false
    }
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Para iniciantes no trading',
    price: 39,
    duration: 30, // dias
    features: [
      'Até 5 sinais por semana',
      'Canal privado do Telegram',
      'Histórico de 30 dias',
      'Análises básicas'
    ],
    limits: {
      signalsPerWeek: 5,
      historicalData: true,
      prioritySupport: false,
      vipGroup: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para traders experientes',
    price: 99,
    duration: 30, // dias
    popular: true,
    features: [
      'Sinais ilimitados',
      'Análises detalhadas',
      'Alertas em tempo real',
      'Suporte prioritário',
      'Histórico completo'
    ],
    limits: {
      signalsPerWeek: -1, // ilimitado
      historicalData: true,
      prioritySupport: true,
      vipGroup: false
    }
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    description: 'Acesso premium completo',
    price: 299,
    duration: 30, // dias
    features: [
      'Todos os sinais premium',
      'Mentoria personalizada 1:1',
      'Grupo VIP exclusivo',
      'Suporte 24/7',
      'Análises personalizadas',
      'Acesso antecipado a novos recursos'
    ],
    limits: {
      signalsPerWeek: -1, // ilimitado
      historicalData: true,
      prioritySupport: true,
      vipGroup: true,
      mentorship: true
    }
  }
}

// GET /api/plans - Listar todos os planos disponíveis
router.get('/', (req, res) => {
  try {
    // Adicionar informações calculadas para cada plano
    const plansWithInfo = Object.values(PLANS).map(plan => ({
      ...plan,
      priceFormatted: plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`,
      durationText: plan.duration === 7 ? '7 dias' : '1 mês',
      savings: plan.id === 'pro' ? 'Mais popular!' : plan.id === 'vip' ? 'Melhor custo-benefício!' : null
    }))

    res.json({ 
      ok: true, 
      plans: plansWithInfo,
      count: plansWithInfo.length
    })
  } catch (error) {
    console.error('❌ Erro ao listar planos:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/plans/:planId - Obter detalhes de um plano específico
router.get('/:planId', (req, res) => {
  try {
    const { planId } = req.params
    const plan = PLANS[planId]

    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' })
    }

    const planWithInfo = {
      ...plan,
      priceFormatted: plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`,
      durationText: plan.duration === 7 ? '7 dias' : '1 mês'
    }

    res.json({ ok: true, plan: planWithInfo })
  } catch (error) {
    console.error('❌ Erro ao obter plano:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/plans/subscribe - Iniciar processo de assinatura
router.post('/subscribe', async (req, res) => {
  try {
    const { planId, paymentMethod, email, name } = req.body

    // Validações
    if (!planId || !PLANS[planId]) {
      return res.status(400).json({ error: 'Plano inválido' })
    }

    if (!paymentMethod || !['stripe', 'mercadopago', 'mercadopago_recurring'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pagamento inválido' })
    }

    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' })
    }

    const plan = PLANS[planId]

    // Se for trial, criar usuário diretamente
    if (planId === 'trial') {
      const trialDuration = 7
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + trialDuration)

      try {
        const user = await User.findOneAndUpdate(
          { email: email.toLowerCase() },
          {
            email: email.toLowerCase(),
            name: name.trim(),
            plan: 'trial',
            status: 'active',
            validUntil: validUntil,
            source: 'trial_direct'
          },
          { upsert: true, new: true }
        )

        return res.json({
          ok: true,
          message: 'Trial ativado com sucesso!',
          user: {
            email: user.email,
            name: user.name,
            plan: user.plan,
            status: user.status,
            validUntil: user.validUntil
          },
          redirect: '/trial-success'
        })
      } catch (dbError) {
        console.warn('⚠️ Erro no BD para trial:', dbError.message)
        return res.status(500).json({ error: 'Erro ao ativar trial' })
      }
    }

    // Para planos pagos, redirecionar para checkout
    let checkoutUrl = null

    if (paymentMethod === 'stripe') {
      // Criar checkout Stripe
      try {
        const mockReq = { query: { plan: planId }, body: { email, name } }
        const mockRes = { 
          json: (data) => data, 
          status: (code) => ({ json: (data) => ({ error: data.error, code }) }),
          headersSent: false 
        }
        
        const stripeResult = await stripeCreateCheckout(mockReq, mockRes)
        
        if (stripeResult && stripeResult.url) {
          checkoutUrl = stripeResult.url
        }
      } catch (stripeError) {
        console.error('Erro Stripe:', stripeError.message)
      }
    } else if (paymentMethod === 'mercadopago') {
      // Criar checkout Mercado Pago (pagamento único)
      try {
        const mockReq = { query: { plan: planId }, body: { email, name } }
        const mockRes = { 
          json: (data) => data, 
          status: (code) => ({ json: (data) => ({ error: data.error, code }) }),
          headersSent: false 
        }
        
        const mpResult = await mpCreateCheckout(mockReq, mockRes)
        
        if (mpResult && mpResult.url) {
          checkoutUrl = mpResult.url
        }
      } catch (mpError) {
        console.error('Erro MP:', mpError.message)
      }
    } else if (paymentMethod === 'mercadopago_recurring') {
      // Criar assinatura recorrente Mercado Pago
      try {
        const mpResult = await mpCreatePreapproval({
          body: { plan: planId, email, name }
        }, { 
          json: (data) => data, 
          status: (code) => ({ json: (data) => data })
        })
        
        if (mpResult && mpResult.data && mpResult.data.init_point) {
          checkoutUrl = mpResult.data.init_point
        }
      } catch (mpError) {
        console.error('Erro MP Recorrente:', mpError.message)
      }
    }

    if (checkoutUrl) {
      res.json({
        ok: true,
        message: 'Redirecionando para pagamento...',
        checkout_url: checkoutUrl,
        plan: plan,
        payment_method: paymentMethod
      })
    } else {
      res.status(500).json({ error: 'Erro ao criar checkout' })
    }

  } catch (error) {
    console.error('❌ Erro na assinatura:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/plans/upgrade - Upgrade de plano para usuários existentes
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body
    const userId = req.user.id

    // Validações
    if (!planId || !PLANS[planId]) {
      return res.status(400).json({ error: 'Plano inválido' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const currentPlan = PLANS[user.plan]
    const newPlan = PLANS[planId]

    // Verificar se é realmente um upgrade
    if (newPlan.price <= currentPlan.price) {
      return res.status(400).json({ error: 'Selecione um plano superior ao atual' })
    }

    // Calcular valor proporcional (se necessário)
    const daysRemaining = Math.max(0, Math.ceil((user.validUntil - new Date()) / (1000 * 60 * 60 * 24)))
    const proportionalDiscount = Math.floor((currentPlan.price * daysRemaining) / 30)
    const upgradePrice = Math.max(0, newPlan.price - proportionalDiscount)

    // Criar checkout com valor ajustado
    // ... implementar lógica de upgrade

    res.json({
      ok: true,
      message: 'Upgrade processado',
      currentPlan: currentPlan,
      newPlan: newPlan,
      upgradePrice: upgradePrice,
      daysRemaining: daysRemaining
    })

  } catch (error) {
    console.error('❌ Erro no upgrade:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/plans/cancel - Cancelar assinatura
router.post('/cancel', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Se tiver preapprovalId do Mercado Pago, cancelar
    if (user.preapprovalId) {
      await mpCancelPreapproval({ params: { userId } }, res)
    }

    // Marcar como cancelado mas manter ativo até o vencimento
    user.status = 'canceled'
    user.canceledAt = new Date()
    await user.save()

    res.json({
      ok: true,
      message: 'Assinatura cancelada. Acesso mantido até o vencimento.',
      user: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        status: user.status,
        validUntil: user.validUntil,
        canceledAt: user.canceledAt
      }
    })

  } catch (error) {
    console.error('❌ Erro no cancelamento:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/plans/user/:email - Obter plano atual do usuário
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const currentPlan = PLANS[user.plan] || PLANS.basic
    const isExpired = user.validUntil && new Date() > user.validUntil
    const daysRemaining = user.validUntil ? Math.max(0, Math.ceil((user.validUntil - new Date()) / (1000 * 60 * 60 * 24))) : 0

    res.json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        status: user.status,
        validUntil: user.validUntil,
        createdAt: user.createdAt
      },
      planDetails: currentPlan,
      subscription: {
        isActive: user.status === 'active' && !isExpired,
        isExpired: isExpired,
        daysRemaining: daysRemaining,
        canUpgrade: user.plan !== 'vip',
        isCanceled: user.status === 'canceled'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao obter dados do usuário:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export { PLANS }
export default router