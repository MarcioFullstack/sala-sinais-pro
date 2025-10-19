import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', (req,res)=>{
  const { email, password } = req.body || {}
  
  // Debug para produção
  console.log('🔐 Login attempt:', { email, password: password ? '***' : 'empty' })
  console.log('🔧 ENV ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET')
  console.log('🔧 ENV ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD || 'NOT SET')
  console.log('🔧 ENV JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET')
  
  if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
    const token = jwt.sign({ email, role:'admin' }, process.env.JWT_SECRET || 'dev', { expiresIn:'12h' })
    console.log('✅ Login successful for:', email)
    return res.json({ token })
  }
  
  console.log('❌ Login failed for:', email)
  return res.status(401).json({ error:'Credenciais inválidas' })
})

// Rota de teste para verificar configurações
router.get('/test-config', (req, res) => {
  res.json({
    adminEmailSet: !!process.env.ADMIN_EMAIL,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    jwtSecretSet: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    expectedEmail: 'admin@csi.invest',
    expectedPassword: '123456'
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
