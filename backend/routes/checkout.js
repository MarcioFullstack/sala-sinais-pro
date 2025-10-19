import express from 'express'
import { mpCreateCheckout } from '../controllers/paymentMPController.js'

const router = express.Router()

// Checkout root - redireciona para nova API de planos
router.get('/', (req, res) => {
  res.redirect('/api/plans')
})

// Checkout start - compatibilidade com sistema antigo
router.get('/start', async (req, res) => {
  try {
    const { plan } = req.query
    
    if (!plan) {
      return res.status(400).json({ error: 'Plano é obrigatório' })
    }

    // Redirecionar para Stripe checkout usando controlador existente
    const { stripeCreateCheckout } = await import('../controllers/paymentStripeController.js')
    return stripeCreateCheckout(req, res)
    
  } catch (error) {
    console.error('Erro no checkout start:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Create checkout (MP integration)
router.get('/mp', mpCreateCheckout)

// Simulate checkout for testing
router.post('/simulate', async (req, res) => {
  const { plan, email } = req.body || {}
  
  if (!plan || !email) {
    return res.status(400).json({ error: 'Plan and email are required' })
  }

  const plans = ['basic', 'pro', 'vip']
  if (!plans.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' })
  }

  // Simulate successful payment
  const mockPayment = {
    id: `sim_${Date.now()}`,
    status: 'approved',
    plan,
    email,
    amount: { basic: 39, pro: 99, vip: 299 }[plan],
    created_at: new Date().toISOString()
  }

  console.log('🧪 Checkout simulado:', mockPayment)
  
  res.json({ 
    ok: true, 
    payment: mockPayment,
    redirect_url: `${process.env.PUBLIC_URL || 'http://localhost:8080'}/?payment=success&plan=${plan}`
  })
})

export default router
