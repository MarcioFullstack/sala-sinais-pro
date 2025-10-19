import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', (req,res)=>{
  const { email, password } = req.body || {}
  if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
    const token = jwt.sign({ email, role:'admin' }, process.env.JWT_SECRET || 'dev', { expiresIn:'12h' })
    return res.json({ token })
  }
  return res.status(401).json({ error:'Credenciais inválidas' })
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
