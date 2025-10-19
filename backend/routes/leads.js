import express from 'express'
import User from '../models/User.js'
import Telegram from '../services/telegram.js'

const router = express.Router()

// Captura de leads da landing page
router.post('/', async (req, res) => {
  try {
    const { email, name, plan = 'trial', source = 'unknown' } = req.body || {}
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' })
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verificar se usuário já existe
    let user = await User.findOne({ email: normalizedEmail }).catch(() => null)
    
    if (user) {
      // Se já existe, apenas atualizar informações se necessário
      if (!user.name || user.name !== name) {
        user.name = name
        user.source = source
        await user.save().catch(() => {})
      }
      
      console.log('👤 Lead já existe:', normalizedEmail)
      return res.json({ 
        ok: true, 
        message: 'Usuário já cadastrado',
        user: { email: user.email, name: user.name, plan: user.plan, status: user.status }
      })
    }

    // Criar novo usuário com trial gratuito
    const trialDuration = 7 // dias
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + trialDuration)

    const userData = {
      email: normalizedEmail,
      name: name.trim(),
      plan: plan,
      status: 'active',
      validUntil: validUntil,
      source: source,
      createdAt: new Date()
    }

    try {
      user = new User(userData)
      await user.save()
      console.log('✅ Novo lead criado:', normalizedEmail, '- Trial até:', validUntil.toLocaleDateString())
    } catch (dbError) {
      console.warn('⚠️ Erro ao salvar no DB:', dbError.message)
      // Continue even if DB fails - we'll still send the welcome message
    }

    // Enviar mensagem de boas-vindas via Telegram (opcional)
    try {
      const welcomeMessage = `🎉 <b>Novo Lead Capturado!</b>

👤 <b>Nome:</b> ${name}
📧 <b>Email:</b> ${normalizedEmail}
📋 <b>Plano:</b> ${plan.toUpperCase()}
📱 <b>Fonte:</b> ${source}
📅 <b>Trial até:</b> ${validUntil.toLocaleDateString('pt-BR')}

🚀 <i>Sala de Sinais PRO - Sistema de Leads</i>`

      await Telegram.sendMessage(welcomeMessage)
    } catch (telegramError) {
      console.warn('⚠️ Erro no Telegram para lead:', telegramError.message)
    }

    res.json({ 
      ok: true, 
      message: 'Lead capturado com sucesso',
      user: { 
        email: user?.email || normalizedEmail, 
        name, 
        plan, 
        status: 'active',
        trialUntil: validUntil.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro na captura de lead:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar leads (opcional - para analytics)
router.get('/', async (req, res) => {
  try {
    const leads = await User.find({ source: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('email name plan status validUntil source createdAt')
    
    res.json({ ok: true, leads, count: leads.length })
  } catch (error) {
    console.warn('⚠️ Erro ao listar leads:', error.message)
    res.json({ ok: true, leads: [], count: 0 })
  }
})

export default router