import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
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

export default router
