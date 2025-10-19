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

// 🍃 MongoDB Configuration
const mongoUri = process.env.MONGO_URI
if (mongoUri) {
  const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
  }
  
  mongoose.connect(mongoUri, mongoConfig)
    .then(() => {
      console.log('✅ MongoDB conectado com sucesso!')
      console.log(`🗄️  Database: ${mongoose.connection.name}`)
    })
    .catch(e => {
      console.error('❌ Erro ao conectar MongoDB:', e.message)
      console.warn('⚠️  Continuando em stub mode...')
    })
} else {
  console.warn('⚠️  MONGO_URI não definida - rodando em stub mode')
  console.log('💡 Para usar MongoDB, configure MONGO_URI no .env')
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

// 🔍 Database Status Endpoint
app.get('/api/admin/test-db', (req, res) => {
  const dbStatus = {
    status: mongoose.connection.readyState,
    statusText: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState],
    mongoUri: process.env.MONGO_URI ? 'Configured' : 'Missing',
    database: mongoose.connection.name || 'Not connected',
    mode: process.env.MONGO_URI ? 'MongoDB' : 'Stub Mode'
  }
  
  res.json({
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Rota de debug específica para admin
app.get('/debug/admin', (req, res) => {
  res.json({
    adminRoute: 'OK',
    staticFiles: 'Configured',
    authMiddleware: 'Loaded',
    environment: process.env.NODE_ENV,
    adminEmail: process.env.ADMIN_EMAIL ? 'Set' : 'Missing',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Stub Mode'
  })
})

const port = process.env.PORT || 8080
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || 'not set'}`)
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'not set'}`)
  
  // MongoDB Status com mais detalhes
  const mongoStatus = process.env.MONGO_URI ? 
    (mongoose.connection.readyState === 1 ? '🍃 MongoDB Connected' : '🟡 MongoDB Configured') : 
    '💾 Stub Mode (In-Memory)'
  console.log(`💾 Database: ${mongoStatus}`)
  
  console.log(`🏠 Access: http://localhost:${port}`)
  console.log(`🔐 Admin: http://localhost:${port}/admin.html`)
  console.log(`❤️ Health: http://localhost:${port}/health`)
  console.log(`🔍 DB Test: http://localhost:${port}/api/admin/test-db`)
})
