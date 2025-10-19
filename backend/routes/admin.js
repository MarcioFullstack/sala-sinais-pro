import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', (req,res)=>{
  const { email, password } = req.body || {}
  
  // Credenciais de fallback caso environment variables não estejam definidas
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@csi.invest'
  const adminPassword = process.env.ADMIN_PASSWORD || '123456'
  const jwtSecret = process.env.JWT_SECRET || 'sala_sinais_jwt_secret_2024_fallback'
  
  // Debug para produção
  console.log('🔐 Login attempt:', { email, password: password ? '***' : 'empty' })
  console.log('🔧 Using ADMIN_EMAIL:', adminEmail)
  console.log('🔧 ENV configured:', {
    email: !!process.env.ADMIN_EMAIL,
    password: !!process.env.ADMIN_PASSWORD,
    jwt: !!process.env.JWT_SECRET
  })
  
  if(email === adminEmail && password === adminPassword){
    const token = jwt.sign({ email, role:'admin' }, jwtSecret, { expiresIn:'12h' })
    console.log('✅ Login successful for:', email)
    return res.json({ token })
  }
  
  console.log('❌ Login failed. Expected:', adminEmail, 'Got:', email)
  return res.status(401).json({ error:'Credenciais inválidas' })
})

// Rota de teste para verificar configurações
router.get('/test-config', (req, res) => {
  res.json({
    adminEmailSet: !!process.env.ADMIN_EMAIL,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    jwtSecretSet: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    fallbackMode: !process.env.ADMIN_EMAIL,
    expectedEmail: process.env.ADMIN_EMAIL || 'admin@csi.invest',
    expectedPassword: process.env.ADMIN_PASSWORD || '123456',
    message: !process.env.ADMIN_EMAIL ? 'Using fallback credentials' : 'Using environment variables'
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
