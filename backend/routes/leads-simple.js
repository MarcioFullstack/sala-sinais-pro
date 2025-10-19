import express from 'express'

const router = express.Router()

// Store temporário para leads (em produção seria banco de dados)
const leadsStore = new Map()

// Captura de leads da landing page - versão simplificada
router.post('/', async (req, res) => {
  try {
    const { email, name, plan = 'trial', source = 'unknown' } = req.body || {}
    
    console.log('📥 Lead recebido:', { email, name, plan, source })
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' })
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Verificar se já existe
    const existingLead = leadsStore.get(normalizedEmail)
    
    if (existingLead) {
      console.log('👤 Lead já existe:', normalizedEmail)
      return res.json({ 
        ok: true, 
        message: 'Usuário já cadastrado',
        user: existingLead
      })
    }

    // Criar novo lead
    const trialDuration = 7 // dias
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + trialDuration)

    const userData = {
      id: leadId,
      email: normalizedEmail,
      name: name.trim(),
      plan: plan,
      status: 'active',
      validUntil: validUntil,
      source: source,
      createdAt: new Date()
    }

    // Salvar no store temporário
    leadsStore.set(normalizedEmail, userData)
    
    console.log('✅ Novo lead criado:', normalizedEmail, '- Trial até:', validUntil.toLocaleDateString())
    console.log('📊 Total de leads:', leadsStore.size)

    // Simular notificação
    console.log(`📱 [TELEGRAM STUB] Novo Lead: ${name} (${normalizedEmail}) - Trial até ${validUntil.toLocaleDateString('pt-BR')}`)

    // Resposta imediata
    res.json({ 
      ok: true, 
      message: 'Lead capturado com sucesso',
      user: { 
        email: userData.email, 
        name: userData.name, 
        plan: userData.plan, 
        status: userData.status,
        trialUntil: userData.validUntil.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro na captura de lead:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar leads (para debug)
router.get('/', async (req, res) => {
  try {
    const leads = Array.from(leadsStore.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 100) // Últimos 100
    
    res.json({ 
      ok: true, 
      leads, 
      count: leads.length,
      totalStored: leadsStore.size
    })
  } catch (error) {
    console.warn('⚠️ Erro ao listar leads:', error.message)
    res.json({ ok: true, leads: [], count: 0 })
  }
})

// GET lead específico por email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params
    const lead = leadsStore.get(email.toLowerCase())
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' })
    }
    
    res.json({ ok: true, lead })
  } catch (error) {
    console.error('❌ Erro ao buscar lead:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router