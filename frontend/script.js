// Sistema de planos integrado
let currentPlans = {}

// Carregar planos disponíveis
async function carregarPlanos() {
  try {
    const response = await fetch('/api/plans')
    const data = await response.json()
    
    if (data.ok && data.plans) {
      currentPlans = data.plans.reduce((acc, plan) => {
        acc[plan.id] = plan
        return acc
      }, {})
      renderizarPlanos(data.plans)
    } else {
      console.error('Erro ao carregar planos:', data.error)
      mostrarPlanosEstaticos()
    }
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    mostrarPlanosEstaticos()
  }
}

// Renderizar planos dinamicamente
function renderizarPlanos(plans) {
  const container = document.getElementById('plansContainer')
  if (!container) return

  // Filtrar apenas planos pagos para exibição
  const planosPagos = plans.filter(plan => plan.id !== 'trial')

  container.innerHTML = planosPagos.map(plan => `
    <div class="card plan ${plan.popular ? 'featured' : ''}" data-plan="${plan.id}">
      <h3>${plan.name}</h3>
      <p class="price">${plan.priceFormatted}${plan.price > 0 ? '/mês' : ''}</p>
      <p class="plan-description">${plan.description}</p>
      <ul class="features-list">
        ${plan.features.map(feature => `<li>✅ ${feature}</li>`).join('')}
      </ul>
      <div class="checkout">
        <button class="btn btn-primary" onclick="assinarPlano('${plan.id}', 'stripe')">
          💳 Pagar com Stripe
        </button>
        <button class="btn btn-ghost" onclick="assinarPlano('${plan.id}', 'mercadopago')">
          💰 Mercado Pago
        </button>
        <button class="btn btn-outline" onclick="assinarPlano('${plan.id}', 'mercadopago_recurring')">
          🔄 MP Recorrente
        </button>
      </div>
    </div>
  `).join('')
}

// Fallback para planos estáticos se a API falhar
function mostrarPlanosEstaticos() {
  const container = document.getElementById('plansContainer')
  if (!container) return

  container.innerHTML = `
    <div class="card plan">
      <h3>Básico</h3>
      <p class="price">R$ 39/mês</p>
      <ul>
        <li>✅ Até 5 sinais/semana</li>
        <li>✅ Canal privado</li>
        <li>✅ Histórico mensal</li>
      </ul>
      <div class="checkout">
        <button class="btn btn-primary" onclick="abrirCheckoutLegado('basic','stripe')">💳 Stripe</button>
        <button class="btn btn-ghost" onclick="abrirCheckoutLegado('basic','mp')">💰 Mercado Pago</button>
        <button class="btn btn-outline" onclick="abrirModalRecorrente('basic')">🔄 MP Recorrente</button>
      </div>
    </div>
    <div class="card plan featured">
      <h3>Pro</h3>
      <p class="price">R$ 99/mês</p>
      <ul>
        <li>✅ Sinais ilimitados</li>
        <li>✅ Análises detalhadas</li>
        <li>✅ Suporte prioritário</li>
      </ul>
      <div class="checkout">
        <button class="btn btn-primary" onclick="abrirCheckoutLegado('pro','stripe')">💳 Stripe</button>
        <button class="btn btn-ghost" onclick="abrirCheckoutLegado('pro','mp')">💰 Mercado Pago</button>
        <button class="btn btn-outline" onclick="abrirModalRecorrente('pro')">🔄 MP Recorrente</button>
      </div>
    </div>
    <div class="card plan">
      <h3>VIP</h3>
      <p class="price">R$ 299/mês</p>
      <ul>
        <li>✅ Sinais premium</li>
        <li>✅ Mentoria personalizada</li>
        <li>✅ Grupo VIP exclusivo</li>
      </ul>
      <div class="checkout">
        <button class="btn btn-primary" onclick="abrirCheckoutLegado('vip','stripe')">💳 Stripe</button>
        <button class="btn btn-ghost" onclick="abrirCheckoutLegado('vip','mp')">💰 Mercado Pago</button>
        <button class="btn btn-outline" onclick="abrirModalRecorrente('vip')">🔄 MP Recorrente</button>
      </div>
    </div>
  `
}

// Nova função para assinar planos
async function assinarPlano(planId, paymentMethod) {
  // Verificar se usuário já se cadastrou para trial
  const leadEmail = localStorage.getItem('leadEmail')
  const leadName = localStorage.getItem('leadName')

  if (!leadEmail || !leadName) {
    alert('📋 Por favor, primeiro preencha o cadastro na seção "Comece com 7 Dias Grátis!" acima.')
    document.getElementById('captura').scrollIntoView({ behavior: 'smooth' })
    return
  }

  try {
    // Mostrar loading
    const button = event.target
    const originalText = button.textContent
    button.disabled = true
    button.textContent = '⏳ Processando...'

    const response = await fetch('/api/plans/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: planId,
        paymentMethod: paymentMethod,
        email: leadEmail,
        name: leadName
      })
    })

    const data = await response.json()

    if (response.ok && data.checkout_url) {
      // Redirecionar para checkout
      window.location.href = data.checkout_url
    } else {
      alert('❌ ' + (data.error || 'Erro ao processar assinatura'))
    }

  } catch (error) {
    console.error('Erro na assinatura:', error)
    alert('❌ Erro de conexão. Tente novamente.')
  } finally {
    // Restaurar botão
    const button = event.target
    button.disabled = false
    button.textContent = originalText
  }
}

// Função legada para compatibilidade
async function abrirCheckoutLegado(plano, provedor){
  try{
    const url = provedor === 'mp'
      ? `/api/mp/checkout/start?plan=${encodeURIComponent(plano)}`
      : `/api/checkout/start?plan=${encodeURIComponent(plano)}`

    const resp = await fetch(url)
    if(resp.ok){
      const data = await resp.json().catch(()=>null)
      if(data && data.url){
        window.location.href = data.url
      }else{
        window.location.href = url
      }
    }else{
      alert('Falha ao iniciar checkout. Verifique o backend.')
    }
  }catch(e){
    alert('Erro no checkout: '+e.message)
  }
}

// Modal MP Recorrente (preapproval)
let planoSelecionado = null
function abrirModalRecorrente(plano){
  planoSelecionado = plano
  document.getElementById('modalRecorrente').classList.add('show')
}
function fecharModal(){
  document.getElementById('modalRecorrente').classList.remove('show')
}

// Cria assinatura recorrente MP (usa rota protegida por JWT no backend em produção).
// Para landing pública, deixamos uma rota simplificada no backend (se quiser, proteja com captcha).
document.getElementById('btnAssinarMP').addEventListener('click', async ()=>{
  const email = document.getElementById('emailRecorrente').value.trim()
  if(!email){ alert('Informe seu e-mail.'); return }
  if(!planoSelecionado){ alert('Plano inválido.'); return }

  try{
    // Endpoint público opcional: você pode proteger no backend se quiser.
    const resp = await fetch('/api/mp/checkout/subscribe', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', /* 'Authorization': 'Bearer <TOKEN-ADMIN>' */ },
      body: JSON.stringify({ email, plan: planoSelecionado })
    })
    const data = await resp.json()
    if(resp.ok && data.ok){
      alert('Assinatura criada! Você será redirecionado pelo Mercado Pago / receberá o fluxo de aprovação.')
      fecharModal()
      // Se o MP retornar um link de aprovação, você pode redirecionar aqui:
      // if (data.data && data.data.init_point) location.href = data.data.init_point
    }else{
      alert('Falha ao criar assinatura: '+(data.error || 'Verifique o backend'))
    }
  }catch(e){
    alert('Erro: '+e.message)
  }
})

// UX: exemplo
document.getElementById('btnAbrirExemplo').addEventListener('click', ()=>{
  document.getElementById('blocoExemplo').scrollIntoView({ behavior:'smooth', block:'center' })
})

// Lead Capture Form
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  console.log('🚀 Formulário submetido!')
  
  const email = document.getElementById('leadEmail').value.trim()
  const name = document.getElementById('leadName').value.trim()
  const submitBtn = e.target.querySelector('button[type="submit"]')
  
  console.log('📧 Email:', email, 'Nome:', name)
  
  if (!email || !name) {
    alert('📋 Por favor, preencha todos os campos!')
    return
  }
  
  // Validação de email básica
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert('📧 Por favor, insira um e-mail válido!')
    return
  }
  
  try {
    // Desabilitar botão durante envio
    submitBtn.disabled = true
    submitBtn.textContent = '⏳ Processando...'
    console.log('⏳ Iniciando envio para API...')
    
    // Timeout para evitar travamento
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), 10000) // 10 segundos
    
    // Criar lead/usuário com trial gratuito
    console.log('📡 Fazendo requisição para /api/leads')
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email.toLowerCase(), 
        name,
        plan: 'trial',
        source: 'landing_page'
      }),
      signal: timeoutController.signal
    })
    
    console.log('📡 Resposta recebida:', response.status, response.statusText)
    
    clearTimeout(timeoutId)
    
    const data = await response.json()
    console.log('📊 Dados recebidos:', data)
    
    if (response.ok) {
      // Salvar dados no localStorage para usar no checkout
      localStorage.setItem('leadEmail', email.toLowerCase())
      localStorage.setItem('leadName', name)
      localStorage.setItem('trialActivated', 'true')
      
      // Sucesso - mostrar feedback imediato
      submitBtn.textContent = '✅ Cadastrado!'
      submitBtn.style.background = '#10b981'
      
      // Mostrar mensagem de sucesso
      setTimeout(() => {
        alert('🎉 Cadastro realizado com sucesso!\n\n✅ Trial de 7 dias ativado!\n🚀 Agora escolha seu plano para continuar após o período gratuito.')
        
        // Não limpar formulário - manter dados para checkout
        // Scroll para seção de planos
        document.getElementById('planos').scrollIntoView({ behavior: 'smooth' })
      }, 500)
    } else {
      // Erro do servidor
      alert('❌ ' + (data.error || 'Erro ao processar cadastro. Tente novamente.'))
    }
  } catch (error) {
    console.error('Erro na captura de lead:', error)
    if (error.name === 'AbortError') {
      alert('⏰ A requisição demorou muito. Tente novamente em alguns segundos.')
    } else {
      alert('❌ Erro de conexão. Verifique sua internet e tente novamente.')
    }
  } finally {
    // Reabilitar botão após 2 segundos
    setTimeout(() => {
      submitBtn.disabled = false
      submitBtn.textContent = '🚀 Começar Grátis'
      submitBtn.style.background = '' // Remove cor personalizada
    }, 2000)
  }
})

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute('href'))
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

// Animação de fade-in nos elementos quando entram na tela
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in')
      observer.unobserve(entry.target)
    }
  })
}, observerOptions)

// Observar elementos para animação
document.querySelectorAll('.card, .step, .plan, .lead-capture').forEach(el => {
  observer.observe(el)
})

// Inicialização quando página carrega
document.addEventListener('DOMContentLoaded', () => {
  // Carregar planos dinamicamente
  carregarPlanos()
  
  // Verificar se há dados salvos do trial
  const trialActivated = localStorage.getItem('trialActivated')
  const savedEmail = localStorage.getItem('leadEmail')
  const savedName = localStorage.getItem('leadName')
  
  if (trialActivated && savedEmail && savedName) {
    // Pré-preencher formulário se já cadastrou
    document.getElementById('leadEmail').value = savedEmail
    document.getElementById('leadName').value = savedName
    
    // Alterar texto do botão
    const submitBtn = document.querySelector('#leadForm button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = '✅ Trial Ativo - Escolha seu Plano'
    }
  }
  
  // Verificar parâmetros de URL para sucesso de pagamento
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('stripe_success') === '1') {
    mostrarSucessoPagamento('Stripe')
  } else if (urlParams.get('mp_success') === '1') {
    mostrarSucessoPagamento('Mercado Pago')
  } else if (urlParams.get('payment') === 'success') {
    mostrarSucessoPagamento('Checkout')
  }
})

// Mostrar mensagem de sucesso do pagamento
function mostrarSucessoPagamento(metodo) {
  setTimeout(() => {
    alert(`🎉 Pagamento aprovado via ${metodo}!\n\n✅ Sua assinatura está ativa!\n📱 Você receberá as instruções de acesso ao Telegram por e-mail em instantes.\n\n🚀 Bem-vindo à Sala de Sinais PRO!`)
    
    // Limpar localStorage após pagamento bem-sucedido
    localStorage.removeItem('leadEmail')
    localStorage.removeItem('leadName')
    localStorage.removeItem('trialActivated')
    
    // Redirecionar para página de sucesso ou remover parâmetros da URL
    const cleanUrl = window.location.origin + window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)
  }, 1000)
}
