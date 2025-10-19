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
import signalsRoutes from './routes/signals.js'
import adminRoutes from './routes/admin.js'
import leadsRoutes from './routes/leads.js'
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

// Rota para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

// Rota de health check para Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
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
app.use('/api/admin', adminRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/signals', auth, signalsRoutes)

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`🚀 API running on http://localhost:${port}`))
