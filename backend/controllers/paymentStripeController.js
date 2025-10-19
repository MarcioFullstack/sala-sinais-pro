import Stripe from 'stripe'
import User from '../models/User.js'
import { addUserToAdmin } from '../routes/admin-simple.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy')

// Mapeamento de planos para Stripe
const STRIPE_PLANS = {
  basic: {
    name: 'Sala de Sinais - Básico',
    amount: 3900, // 39.00 BRL em centavos
    currency: 'brl'
  },
  pro: {
    name: 'Sala de Sinais - Pro',
    amount: 9900, // 99.00 BRL em centavos
    currency: 'brl'
  },
  vip: {
    name: 'Sala de Sinais - VIP',
    amount: 29900, // 299.00 BRL em centavos
    currency: 'brl'
  }
}

export async function stripeCreateCheckout(req, res) {
  try {
    const { plan } = req.query
    const { email, name } = req.body || {}

    if (!STRIPE_PLANS[plan]) {
      return res.status(400).json({ error: 'Plano inválido' })
    }

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' })
    }

    const planConfig = STRIPE_PLANS[plan]
    const successUrl = `${process.env.PUBLIC_URL || 'http://localhost:8080'}/?stripe_success=1&plan=${plan}`
    const cancelUrl = `${process.env.PUBLIC_URL || 'http://localhost:8080'}/?stripe_canceled=1`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.name,
              description: `Assinatura mensal - ${planConfig.name}`,
            },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        plan: plan,
        email: email,
        name: name || 'Cliente'
      }
    })

    console.log('✅ Checkout Stripe criado:', session.id, 'Plan:', plan)

    // Retornar URL para redirecionamento
    if (res.headersSent) {
      return { url: session.url }
    } else {
      return res.json({ url: session.url })
    }

  } catch (error) {
    console.error('❌ Erro no checkout Stripe:', error.message)
    
    if (res.headersSent) {
      return { error: error.message }
    } else {
      return res.status(500).json({ error: 'Falha ao criar checkout Stripe' })
    }
  }
}

export async function stripeWebhook(req, res) {
  try {
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event
    
    if (endpointSecret) {
      // Verificar assinatura do webhook
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } else {
      // Para desenvolvimento sem webhook secret
      event = req.body
    }

    console.log('📥 Webhook Stripe recebido:', event.type)

    // Processar evento de pagamento aprovado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      const email = session.customer_email || session.metadata?.email
      const plan = session.metadata?.plan || 'basic'
      const customerName = session.metadata?.name || 'Cliente'

      if (email) {
        // Calcular data de validade (30 dias)
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 30)

        // Atualizar ou criar usuário no banco de dados
        try {
          const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
              email: email.toLowerCase(),
              name: customerName,
              plan: plan,
              status: 'active',
              validUntil: validUntil,
              source: 'stripe_checkout',
              stripeSessionId: session.id
            },
            { upsert: true, new: true }
          )

          console.log('✅ Usuário Stripe atualizado no banco:', email, 'Plan:', plan, 'Válido até:', validUntil.toLocaleDateString())
        } catch (dbError) {
          console.warn('⚠️ MongoDB não disponível para Stripe, usando stub mode:', dbError.message)
        }

        // SEMPRE adicionar ao painel admin (funciona sem MongoDB)
        try {
          addUserToAdmin({
            email: email,
            name: customerName,
            plan: plan,
            source: 'stripe_payment'
          })
          console.log('✅ Usuário Stripe adicionado ao painel admin:', email)
        } catch (adminError) {
          console.error('❌ Erro ao adicionar usuário ao admin:', adminError.message)
        }
      }
    }

    // Responder que recebemos o webhook
    res.json({ received: true })

  } catch (error) {
    console.error('❌ Erro no webhook Stripe:', error.message)
    res.status(400).json({ error: 'Webhook inválido' })
  }
}

export async function stripeCreateSubscription(req, res) {
  try {
    const { email, plan, paymentMethodId } = req.body

    if (!email || !plan || !paymentMethodId) {
      return res.status(400).json({ error: 'Email, plano e método de pagamento são obrigatórios' })
    }

    if (!STRIPE_PLANS[plan]) {
      return res.status(400).json({ error: 'Plano inválido' })
    }

    // Criar ou encontrar cliente
    let customer
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 })
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // Anexar método de pagamento ao cliente
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    })

    // Criar produto (se não existir)
    const planConfig = STRIPE_PLANS[plan]
    let product
    try {
      product = await stripe.products.create({
        name: planConfig.name,
        metadata: { plan: plan }
      })
    } catch (e) {
      // Produto pode já existir
      const products = await stripe.products.list({ limit: 10 })
      product = products.data.find(p => p.metadata?.plan === plan)
      
      if (!product) {
        throw new Error('Não foi possível criar/encontrar o produto')
      }
    }

    // Criar preço (se não existir)
    let price
    try {
      price = await stripe.prices.create({
        unit_amount: planConfig.amount,
        currency: planConfig.currency,
        recurring: { interval: 'month' },
        product: product.id,
      })
    } catch (e) {
      // Preço pode já existir
      const prices = await stripe.prices.list({ product: product.id, limit: 10 })
      price = prices.data.find(p => p.unit_amount === planConfig.amount)
      
      if (!price) {
        throw new Error('Não foi possível criar/encontrar o preço')
      }
    }

    // Criar assinatura
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
      metadata: {
        email: email,
        plan: plan
      }
    })

    console.log('✅ Assinatura Stripe criada:', subscription.id)

    res.json({
      ok: true,
      subscription: subscription,
      customer: customer
    })

  } catch (error) {
    console.error('❌ Erro na assinatura Stripe:', error.message)
    res.status(500).json({ error: 'Falha ao criar assinatura recorrente' })
  }
}

export default {
  stripeCreateCheckout,
  stripeWebhook,
  stripeCreateSubscription
}