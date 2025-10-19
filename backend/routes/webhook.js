import express from 'express'
import { mpWebhook } from '../controllers/paymentMPController.js'
import User from '../models/User.js'

const router = express.Router()

// Mercado Pago webhook
router.post('/mp', mpWebhook)

// Generic webhook for testing
router.post('/', async (req, res) => {
  try {
    console.log('📥 Webhook recebido:', req.body)
    
    const { type, data, email, plan } = req.body || {}
    
    if (type === 'payment' && data && email && plan) {
      // Process payment webhook
      const validUntil = new Date()
      validUntil.setMonth(validUntil.getMonth() + 1)
      
      try {
        const user = await User.findOneAndUpdate(
          { email: email.toLowerCase() },
          { 
            email: email.toLowerCase(), 
            plan, 
            status: 'active', 
            validUntil,
            name: data.payer?.name || 'Cliente'
          },
          { upsert: true, new: true }
        )
        
        console.log('✅ Usuário atualizado via webhook:', user.email, user.plan)
        
        res.json({ ok: true, user })
      } catch (dbError) {
        console.warn('⚠️ Erro no DB durante webhook:', dbError.message)
        res.json({ ok: true, warning: 'DB not available' })
      }
    } else {
      // Generic webhook response
      res.json({ ok: true, received: true, timestamp: Date.now() })
    }
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error.message)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Health check
router.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    webhook: 'active',
    endpoints: ['/mp', '/'],
    timestamp: Date.now()
  })
})

export default router
