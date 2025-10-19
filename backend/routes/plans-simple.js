import express from 'express'

const router = express.Router()

// Definição dos planos disponíveis - versão simplificada
const PLANS = {
  trial: {
    id: 'trial',
    name: 'Trial Gratuito',
    description: '7 dias grátis para testar',
    price: 0,
    duration: 7,
    features: [
      'Até 3 sinais por semana',
      'Acesso ao canal básico',
      'Suporte por email'
    ]
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Para iniciantes no trading',
    price: 39,
    duration: 30,
    features: [
      'Até 5 sinais por semana',
      'Canal privado do Telegram',
      'Histórico de 30 dias',
      'Análises básicas'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para traders experientes',
    price: 99,
    duration: 30,
    popular: true,
    features: [
      'Sinais ilimitados',
      'Análises detalhadas',
      'Alertas em tempo real',
      'Suporte prioritário',
      'Histórico completo'
    ]
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    description: 'Acesso premium completo',
    price: 299,
    duration: 30,
    features: [
      'Todos os sinais premium',
      'Mentoria personalizada 1:1',
      'Grupo VIP exclusivo',
      'Suporte 24/7',
      'Análises personalizadas',
      'Acesso antecipado a novos recursos'
    ]
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

// POST /api/plans/subscribe - Iniciar processo de assinatura (stub)
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

    // Se for trial, simular criação
    if (planId === 'trial') {
      console.log('🎯 Trial ativado para:', email, name)
      
      return res.json({
        ok: true,
        message: 'Trial ativado com sucesso!',
        user: {
          email: email.toLowerCase(),
          name: name,
          plan: 'trial',
          status: 'active'
        }
      })
    }

    // Para planos pagos, simular checkout
    const checkoutUrl = `http://localhost:8080/?mock_checkout=1&plan=${planId}&method=${paymentMethod}&email=${encodeURIComponent(email)}`

    console.log('💳 Checkout simulado para:', email, 'Plano:', planId, 'Método:', paymentMethod)

    res.json({
      ok: true,
      message: 'Redirecionando para pagamento...',
      checkout_url: checkoutUrl,
      plan: plan,
      payment_method: paymentMethod
    })

  } catch (error) {
    console.error('❌ Erro na assinatura:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export { PLANS }
export default router