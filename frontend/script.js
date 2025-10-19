// Abre checkout Stripe/MP (pagamento pontual)
async function abrirCheckout(plano, provedor){
  try{
    const url = provedor === 'mp'
      ? `/api/mp/checkout/start?plan=${encodeURIComponent(plano)}`
      : `/api/checkout/start?plan=${encodeURIComponent(plano)}`

    // Alguns backends retornam { url } — aqui tratamos os 2 casos:
    const resp = await fetch(url)
    if(resp.ok){
      const data = await resp.json().catch(()=>null)
      if(data && data.url){
        window.location.href = data.url
      }else{
        // Se o backend já redirecionar por si, faça fallback:
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
  
  const email = document.getElementById('leadEmail').value.trim()
  const name = document.getElementById('leadName').value.trim()
  const submitBtn = e.target.querySelector('button[type="submit"]')
  
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
    
    // Criar lead/usuário com trial gratuito
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email.toLowerCase(), 
        name,
        plan: 'trial',
        source: 'landing_page'
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // Sucesso - mostrar mensagem e redirecionar para planos
      alert('🎉 Cadastro realizado com sucesso!\n\n✅ Você receberá as instruções de acesso ao Telegram por e-mail em instantes.\n\n🚀 Agora escolha seu plano para continuar recebendo sinais após o período gratuito!')
      
      // Limpar formulário
      document.getElementById('leadEmail').value = ''
      document.getElementById('leadName').value = ''
      
      // Scroll para seção de planos
      document.getElementById('planos').scrollIntoView({ behavior: 'smooth' })
    } else {
      // Erro do servidor
      alert('❌ ' + (data.error || 'Erro ao processar cadastro. Tente novamente.'))
    }
  } catch (error) {
    console.error('Erro na captura de lead:', error)
    alert('❌ Erro de conexão. Verifique sua internet e tente novamente.')
  } finally {
    // Reabilitar botão
    submitBtn.disabled = false
    submitBtn.textContent = '🚀 Começar Grátis'
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
