import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

import checkoutRoutes from './routes/checkout.js'
import mpRoutes from './routes/mp.js'
import webhookRoutes from './routes/webhook.js'
import telegramWebhookRoutes from './routes/telegramWebhook.js'
import signalsRoutes from './routes/signals.js'
import adminRoutes from './routes/admin-simple.js'
import leadsRoutes from './routes/leads-simple.js'
import plansRoutes from './routes/plans-simple.js'
import { auth } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Configuração mais permissiva do CSP para produção
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "fonts.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  }
}))
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false }))

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')))

// Rota específica para admin.html
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'))
})

// Rota específica para termos.html
app.get('/termos.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/termos.html'))
})

// Rota específica para privacidade.html
app.get('/privacidade.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/privacidade.html'))
})

// Rota para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

// Rota de health check otimizada para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK')
})

// serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

const mongoUri = process.env.MONGO_URI
if (mongoUri) {
  mongoose.connect(mongoUri).then(() => console.log('✅ MongoDB connected')).catch(e => console.error('Mongo error', e))
} else {
  console.warn('⚠️  MONGO_URI not set - running in stub mode')
}

app.use('/api/checkout', checkoutRoutes)
app.use('/api/mp/checkout', mpRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api/telegram', telegramWebhookRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/plans', plansRoutes)
app.use('/api/signals', auth, signalsRoutes)

// Webhook do Stripe (raw body needed)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const { stripeWebhook } = await import('./controllers/paymentStripeController.js')
  return stripeWebhook(req, res)
})

// Rota de debug específica para admin
app.get('/debug/admin', (req, res) => {
  res.json({
    adminRoute: 'OK',
    staticFiles: 'Configured',
    authMiddleware: 'Loaded',
    environment: process.env.NODE_ENV,
    adminEmail: process.env.ADMIN_EMAIL ? 'Set' : 'Missing',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing'
  })
})

const port = process.env.PORT || 8080
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || 'not set'}`)
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'not set'}`)
  console.log(`💾 MongoDB: ${process.env.MONGO_URI ? 'connected' : 'stub mode'}`)
  console.log(`🏠 Access: http://localhost:${port}`)
  console.log(`🔐 Admin: http://localhost:${port}/admin.html`)
  console.log(`❤️ Health: http://localhost:${port}/health`)
})
