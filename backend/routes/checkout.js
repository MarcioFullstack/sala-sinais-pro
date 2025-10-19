import express from 'express'
import { mpCreateCheckout } from '../controllers/paymentMPController.js'

const router = express.Router()

// Checkout root - lista planos disponíveis
router.get('/', (req, res) => {
  const plans = {
    basic: { name: 'Básico', price: 39, features: ['Sinais básicos', 'Suporte por email'] },
    pro: { name: 'Pro', price: 99, features: ['Sinais avançados', 'Análises detalhadas', 'Suporte prioritário'] },
    vip: { name: 'VIP', price: 299, features: ['Todos os sinais', 'Consultoria personalizada', 'Suporte 24/7', 'Grupo VIP'] }
  }
  res.json({ ok: true, plans })
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
