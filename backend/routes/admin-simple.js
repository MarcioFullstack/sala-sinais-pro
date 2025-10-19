import express from 'express'
import jwt from 'jsonwebtoken'
import { auth } from '../middleware/auth.js'

const router = express.Router()

// Sistema de usuários em memória (stub mode)
const usersDb = new Map()
let userIdCounter = 1

// Função para gerar ID único
function generateUserId() {
  return String(userIdCounter++)
}

// Função para adicionar usuário automaticamente
export function addUserToAdmin(userData) {
  const { email, name, plan = 'basic', source = 'payment', telegramId = null } = userData
  
  if (!email) {
    console.warn('⚠️ Tentativa de adicionar usuário sem email')
    return null
  }

  // Verificar se usuário já existe
  let existingUser = null
  for (const [id, user] of usersDb.entries()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      existingUser = { id, ...user }
      break
    }
  }

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30) // 30 dias

  const userData_final = {
    email: email.toLowerCase(),
    name: name || 'Cliente',
    plan: plan,
    status: 'active',
    validUntil: validUntil.toISOString(),
    telegramId: telegramId,
    source: source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  if (existingUser) {
    // Atualizar usuário existente
    usersDb.set(existingUser.id, { ...userData_final })
    console.log('✅ Usuário atualizado no admin:', email, 'Plan:', plan)
    return { id: existingUser.id, ...userData_final }
  } else {
    // Criar novo usuário
    const newId = generateUserId()
    usersDb.set(newId, userData_final)
    console.log('✅ Novo usuário adicionado ao admin:', email, 'Plan:', plan)
    return { id: newId, ...userData_final }
  }
}

// Login admin
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  
  const adminEmail = 'admin@csi.invest'
  const adminPassword = '123456'
  const jwtSecret = 'sala_sinais_jwt_secret_2024_fallback'
  
  console.log('🔐 Login attempt:', { email, password: password ? '***' : 'empty' })
  
  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '12h' })
    console.log('✅ Login successful for:', email)
    return res.json({ token })
  }
  
  console.log('❌ Login failed. Expected email:', adminEmail, 'Got:', email)
  return res.status(401).json({ error: 'Credenciais inválidas' })
})

// Listar usuários
router.get('/users', auth, async (req, res) => {
  try {
    const users = Array.from(usersDb.entries()).map(([id, user]) => ({
      _id: id,
      id: id,
      ...user
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    console.log(`📋 Listando ${users.length} usuários no admin`)
    res.json(users)
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Criar usuário
router.post('/users', auth, async (req, res) => {
  try {
    const { email, name, plan = 'basic', telegramId = null, status = 'active', validUntil = null } = req.body || {}
    
    if (!email) {
      return res.status(400).json({ error: 'Email obrigatório' })
    }

    const finalValidUntil = validUntil ? new Date(validUntil).toISOString() : (() => {
      const date = new Date()
      date.setDate(date.getDate() + 30)
      return date.toISOString()
    })()

    const userData = {
      email: email.toLowerCase(),
      name: name || 'Cliente',
      plan: plan,
      status: status,
      validUntil: finalValidUntil,
      telegramId: telegramId,
      source: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const newId = generateUserId()
    usersDb.set(newId, userData)
    
    const responseUser = { _id: newId, id: newId, ...userData }
    console.log('✅ Usuário criado via admin:', email)
    res.json(responseUser)
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Atualizar usuário
router.patch('/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body || {}
    
    if (!usersDb.has(id)) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const currentUser = usersDb.get(id)
    const updatedUser = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    usersDb.set(id, updatedUser)
    
    const responseUser = { _id: id, id: id, ...updatedUser }
    console.log('✅ Usuário atualizado:', updatedUser.email)
    res.json(responseUser)
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Deletar usuário
router.delete('/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    
    if (!usersDb.has(id)) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const user = usersDb.get(id)
    usersDb.delete(id)
    
    console.log('🗑️ Usuário deletado:', user.email)
    res.json({ ok: true })
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Rota de teste para verificar configurações
router.get('/test-config', (req, res) => {
  res.json({
    adminEmailSet: false,
    adminPasswordSet: false, 
    jwtSecretSet: false,
    nodeEnv: process.env.NODE_ENV,
    mode: 'SIMPLE_STUB_MODE',
    expectedEmail: 'admin@csi.invest',
    expectedPassword: '123456',
    message: 'Using STUB mode with in-memory users storage',
    instructions: 'Login with: admin@csi.invest / 123456',
    usersInMemory: usersDb.size,
    timestamp: new Date().toISOString()
  })
})

// Estatísticas dos usuários
router.get('/telegram-stats', auth, async (req, res) => {
  try {
    const allUsers = Array.from(usersDb.values())
    const totalUsers = allUsers.length
    const usersWithTelegram = allUsers.filter(u => u.telegramId && u.telegramId.trim() !== '').length
    const activeUsersWithTelegram = allUsers.filter(u => 
      u.status === 'active' && u.telegramId && u.telegramId.trim() !== ''
    ).length

    res.json({
      total_users: totalUsers,
      users_with_telegram: usersWithTelegram,
      active_users_with_telegram: activeUsersWithTelegram,
      coverage_percentage: totalUsers > 0 ? Math.round((usersWithTelegram / totalUsers) * 100) : 0,
      bot_configured: !!(process.env.TELEGRAM_BOT_TOKEN),
      channel_configured: !!(process.env.TELEGRAM_CHAT_ID)
    })
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Teste de envio Telegram (versão simplificada)
router.post('/test-telegram', auth, async (req, res) => {
  try {
    const { message, telegramId, type = 'broadcast' } = req.body || {}
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    // Simulação de envio (não envia realmente)
    console.log('📱 Simulando envio Telegram:', { type, telegramId, message })
    
    res.json({
      ok: true,
      type,
      result: 'Simulado - Telegram não configurado',
      sent: false,
      simulation: true
    })
  } catch (error) {
    console.error('❌ Erro no teste do Telegram:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router