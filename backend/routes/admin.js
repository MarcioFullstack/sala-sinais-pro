import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Telegram from '../services/telegram.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', (req,res)=>{
  const { email, password } = req.body || {}
  
  // CREDENCIAIS FIXAS - SEMPRE FUNCIONAM
  const adminEmail = 'admin@csi.invest'
  const adminPassword = '123456'
  const jwtSecret = 'sala_sinais_jwt_secret_2024_fallback'
  
  // Debug para produção
  console.log('🔐 Login attempt:', { email, password: password ? '***' : 'empty' })
  console.log('🔧 ADMIN_EMAIL fixo:', adminEmail)
  console.log('🔧 ADMIN_PASSWORD fixo:', adminPassword)
  console.log('🔧 Comparação:', { expected: adminEmail, received: email, match: email === adminEmail })
  console.log('🔧 Password match:', password === adminPassword)
  
  if(email === adminEmail && password === adminPassword){
    const token = jwt.sign({ email, role:'admin' }, jwtSecret, { expiresIn:'12h' })
    console.log('✅ Login successful for:', email)
    return res.json({ token })
  }
  
  console.log('❌ Login failed. Expected email:', adminEmail, 'Got:', email)
  console.log('❌ Expected password: 123456, Got length:', password?.length)
  return res.status(401).json({ error:'Credenciais inválidas' })
})

// Rota de teste para verificar configurações
router.get('/test-config', (req, res) => {
  res.json({
    adminEmailSet: false, // Forçado para false pois usamos credenciais fixas
    adminPasswordSet: false, // Forçado para false pois usamos credenciais fixas
    jwtSecretSet: false, // Forçado para false pois usamos credenciais fixas
    nodeEnv: process.env.NODE_ENV,
    mode: 'FIXED_CREDENTIALS',
    expectedEmail: 'admin@csi.invest',
    expectedPassword: '123456',
    message: 'Using FIXED credentials - Environment variables ignored',
    instructions: 'Login with: admin@csi.invest / 123456',
    timestamp: new Date().toISOString()
  })
})

router.get('/users', auth, async (req,res)=>{
  const users = await User.find().sort({ createdAt:-1 }).limit(500)
  res.json(users)
})

router.post('/users', auth, async (req,res)=>{
  const { email, name, plan='basic', telegramId=null, status='active', validUntil=null } = req.body||{}
  if(!email) return res.status(400).json({ error:'Email obrigatório' })
  const doc = await User.create({ email: email.toLowerCase(), name, plan, telegramId, status, validUntil })
  res.json(doc)
})

router.patch('/users/:id', auth, async (req,res)=>{
  const { id } = req.params
  const doc = await User.findByIdAndUpdate(id, req.body||{}, { new:true })
  res.json(doc)
})

router.delete('/users/:id', auth, async (req,res)=>{
  const { id } = req.params
  await User.findByIdAndDelete(id)
  res.json({ ok:true })
})

// Rota para testar envio de mensagem Telegram
router.post('/test-telegram', auth, async (req, res) => {
  try {
    const { message, telegramId, type = 'broadcast' } = req.body || {}
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    let result = null
    
    if (type === 'private' && telegramId) {
      // Envio privado para um usuário específico
      result = await Telegram.sendPrivateMessage(telegramId, message)
    } else if (type === 'broadcast') {
      // Broadcast para todos os usuários
      result = await Telegram.broadcastSignal(message)
    } else {
      // Envio apenas para o canal principal
      result = await Telegram.sendMessage(message)
    }

    res.json({
      ok: true,
      type,
      result,
      sent: result ? true : false
    })
  } catch (error) {
    console.error('❌ Erro no teste do Telegram:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Rota para obter estatísticas do Telegram
router.get('/telegram-stats', auth, async (req, res) => {
  try {
    let totalUsers = 0
    let usersWithTelegram = 0
    let activeUsersWithTelegram = 0

    try {
      totalUsers = await User.countDocuments()
      usersWithTelegram = await User.countDocuments({
        telegramId: { $exists: true, $ne: null, $ne: '' }
      })
      activeUsersWithTelegram = await User.countDocuments({
        status: 'active',
        telegramId: { $exists: true, $ne: null, $ne: '' }
      })
    } catch (dbError) {
      console.warn('⚠️ MongoDB não conectado para estatísticas:', dbError.message)
    }

    res.json({
      total_users: totalUsers,
      users_with_telegram: usersWithTelegram,
      active_users_with_telegram: activeUsersWithTelegram,
      coverage_percentage: totalUsers > 0 ? Math.round((usersWithTelegram / totalUsers) * 100) : 0,
      bot_configured: !!(process.env.TELEGRAM_BOT_TOKEN),
      channel_configured: !!(process.env.TELEGRAM_CHAT_ID)
    })
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas do Telegram:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router
