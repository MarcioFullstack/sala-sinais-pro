import mercadopago from 'mercadopago'
import User from '../models/User.js'
import { addUserToAdmin } from '../routes/admin-simple.js'

const mpClient = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })

export async function mpCreateCheckout(req, res){
  try{
    const { plan } = req.query
    const titleMap = { basic:'Sala de Sinais — Básico', pro:'Sala de Sinais — Pro', vip:'Sala de Sinais — VIP' }
    const priceMap = { basic:39, pro:99, vip:299 } // BRL
    if(!titleMap[plan]) return res.status(400).json({ error:'Plano inválido' })
    const pref = new mercadopago.Preference(mpClient)
    const p = await pref.create({
      body: {
        items: [{ title: titleMap[plan], quantity: 1, currency_id: 'BRL', unit_price: priceMap[plan] }],
        back_urls: {
          success: `${process.env.PUBLIC_URL}/?mp_success=1`,
          failure: `${process.env.PUBLIC_URL}/?mp_failed=1`,
          pending: `${process.env.PUBLIC_URL}/?mp_pending=1`
        },
        auto_return: 'approved',
        metadata: { plan }
      }
    })
    return res.json({ url: p.init_point || p.sandbox_init_point })
  }catch(e){
    console.error('MP checkout error', e.message)
    res.status(500).json({ error:'Falha ao criar checkout MP' })
  }
}

export async function mpWebhook(req, res){
  try{
    const topic = req.query.topic || req.body?.type
    if(topic){
      const email = (req.body?.payer?.email || 'comprador@mp.com').toLowerCase()
      const plan = (req.body?.metadata?.plan) || 'basic'
      const payerName = req.body?.payer?.first_name || req.body?.payer?.name || 'Cliente MP'
      
      // Tentar salvar no banco de dados
      try {
        const validUntil = new Date(); 
        validUntil.setMonth(validUntil.getMonth() + 1)
        await User.findOneAndUpdate(
          { email }, 
          { email, name: payerName, plan, status:'active', validUntil, source: 'mercadopago' }, 
          { upsert:true }
        )
        console.log('✅ MP usuário registrado no banco:', email, plan)
      } catch (dbError) {
        console.warn('⚠️ MongoDB não disponível para MP, usando stub mode:', dbError.message)
      }

      // SEMPRE adicionar ao painel admin (funciona sem MongoDB)
      try {
        addUserToAdmin({
          email: email,
          name: payerName,
          plan: plan,
          source: 'mercadopago_payment'
        })
        console.log('✅ Usuário MP adicionado ao painel admin:', email)
      } catch (adminError) {
        console.error('❌ Erro ao adicionar usuário MP ao admin:', adminError.message)
      }
    }
    res.json({ received:true })
  }catch(e){
    console.error('MP webhook error', e.message)
    res.status(400).json({ error:'Webhook MP inválido' })
  }
}

export async function mpCreatePreapproval(req, res){
  try{
    const { plan, email } = req.body || {}
    const priceMap = { basic:39, pro:99, vip:299 }
    if(!priceMap[plan]) return res.status(400).json({ error:'Plano inválido' })
    if(!email) return res.status(400).json({ error:'Informe o email do assinante' })

    const preapproval = new mercadopago.PreApproval(mpClient)
    const body = {
      reason: `Sala de Sinais — ${plan.toUpperCase()}`,
      external_reference: `plan_${plan}_${Date.now()}`,
      payer_email: email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: priceMap[plan],
        currency_id: 'BRL'
      },
      back_url: `${process.env.PUBLIC_URL}/assinatura/sucesso`
    }
    const resp = await preapproval.create({ body })
    const preapprovalId = resp && (resp.id || resp.body?.id)

    // Tentar salvar no usuário (banco de dados)
    let user = null
    try {
      const validUntil = new Date(); 
      validUntil.setMonth(validUntil.getMonth() + 1)
      user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { email: email.toLowerCase(), plan, status:'active', validUntil, preapprovalId, source: 'mercadopago_recurring' },
        { upsert:true, new:true }
      )
      console.log('✅ MP Recorrente - usuário salvo no banco:', email)
    } catch (dbError) {
      console.warn('⚠️ MongoDB não disponível para MP Recorrente, usando stub mode:', dbError.message)
    }

    // SEMPRE adicionar ao painel admin (funciona sem MongoDB)
    try {
      addUserToAdmin({
        email: email,
        name: 'Cliente MP Recorrente',
        plan: plan,
        source: 'mercadopago_recurring'
      })
      console.log('✅ Usuário MP Recorrente adicionado ao painel admin:', email)
    } catch (adminError) {
      console.error('❌ Erro ao adicionar usuário MP Recorrente ao admin:', adminError.message)
    }

    res.json({ ok:true, data: resp, user })
  }catch(e){
    console.error('MP preapproval error', e.message)
    res.status(500).json({ error:'Falha ao criar assinatura recorrente (MP)' })
  }
}

export async function mpCancelPreapproval(req, res){
  try{
    const { userId } = req.params
    // carrega usuário para pegar o preapprovalId
    const user = await User.findById(userId)
    if(!user || !user.preapprovalId) return res.status(404).json({ error:'Usuário sem preapprovalId' })
    const preapproval = new mercadopago.PreApproval(mpClient)
    const resp = await preapproval.update({ id: user.preapprovalId, body: { status: 'paused' } })
    user.status = 'canceled'
    await user.save()
    res.json({ ok:true, data: resp, user })
  }catch(e){
    console.error('MP cancel preapproval error', e.message)
    res.status(500).json({ error:'Falha ao cancelar assinatura (MP)' })
  }
}
