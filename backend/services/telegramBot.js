import axios from 'axios'
import User from '../models/User.js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://sala-sinais-pro-dxw0.onrender.com'

class TelegramBot {
  constructor() {
    this.botToken = BOT_TOKEN
    this.apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}`
  }

  // Enviar mensagem para um chat específico
  async sendMessage(chatId, text, options = {}) {
    if (!this.botToken) {
      console.log('[TelegramBot] BOT_TOKEN não configurado')
      console.log(`[TelegramBot] Mensagem para ${chatId}:`, text)
      return { ok: true, message_id: Date.now(), stub: true }
    }

    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      }

      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload)
      
      if (response.data.ok) {
        console.log(`✅ Mensagem enviada para ${chatId}:`, response.data.result.message_id)
        return response.data.result
      } else {
        console.error('❌ Erro ao enviar mensagem:', response.data)
        return null
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${chatId}:`, error.message)
      return null
    }
  }

  // Configurar webhook
  async setWebhook(webhookUrl) {
    if (!this.botToken) {
      console.log('[TelegramBot] BOT_TOKEN não configurado - webhook não definido')
      return false
    }

    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: webhookUrl
      })

      console.log('🔗 Webhook configurado:', response.data)
      return response.data.ok
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error.message)
      return false
    }
  }

  // Remover webhook
  async deleteWebhook() {
    if (!this.botToken) return false

    try {
      const response = await axios.post(`${this.apiUrl}/deleteWebhook`)
      console.log('🗑️ Webhook removido:', response.data)
      return response.data.ok
    } catch (error) {
      console.error('❌ Erro ao remover webhook:', error.message)
      return false
    }
  }

  // Processar mensagem recebida
  async processMessage(message) {
    const chatId = message.chat.id
    const text = message.text
    const userId = message.from.id
    const firstName = message.from.first_name
    const lastName = message.from.last_name
    const username = message.from.username

    console.log(`📱 Mensagem recebida de ${firstName} (${userId}):`, text)

    // Comandos disponíveis
    if (text.startsWith('/')) {
      return await this.handleCommand(chatId, text, {
        userId,
        firstName,
        lastName,
        username
      })
    }

    // Mensagem comum - dar boas vindas ou instruções
    return await this.handleGeneralMessage(chatId, text, {
      userId,
      firstName,
      lastName,
      username
    })
  }

  // Manipular comandos do bot
  async handleCommand(chatId, command, userInfo) {
    const { userId, firstName } = userInfo

    switch (command.toLowerCase()) {
      case '/start':
        return await this.handleStartCommand(chatId, userInfo)
      
      case '/help':
        return await this.handleHelpCommand(chatId)
      
      case '/status':
        return await this.handleStatusCommand(chatId, userId)
      
      case '/cadastro':
        return await this.handleCadastroCommand(chatId, userInfo)
      
      case '/planos':
        return await this.handlePlanosCommand(chatId)
      
      default:
        await this.sendMessage(chatId, `❓ Comando não reconhecido: ${command}

Digite /help para ver os comandos disponíveis.`)
        break
    }
  }

  // Comando /start
  async handleStartCommand(chatId, userInfo) {
    const { userId, firstName } = userInfo

    // Verificar se usuário já existe
    let user = null
    try {
      user = await User.findOne({ telegramId: userId.toString() })
    } catch (error) {
      console.warn('⚠️ Erro ao buscar usuário no DB:', error.message)
    }

    const welcomeMessage = `🚀 <b>Bem-vindo à Sala de Sinais PRO!</b>

👋 Olá ${firstName}! Eu sou o bot oficial da <b>CSI Invest</b>.

${user ? 
  `✅ <b>Você já está cadastrado!</b>
📧 Email: ${user.email}
📋 Plano: ${user.plan.toUpperCase()}
🔄 Status: ${user.status === 'active' ? '✅ Ativo' : '❌ Inativo'}

📱 Você receberá nossos sinais automaticamente quando estiver ativo!` :
  
  `📝 <b>Para receber nossos sinais premium:</b>
1️⃣ Cadastre-se em nosso sistema
2️⃣ Escolha seu plano
3️⃣ Receba sinais em tempo real!`}

🎯 <b>Comandos disponíveis:</b>
/help - Ver todos os comandos
/status - Verificar seu status
/cadastro - Como se cadastrar
/planos - Ver planos disponíveis

💎 <b>Sobre nossos sinais:</b>
• 📈 Forex, Crypto e Ações
• 🎯 Take Profits múltiplos
• 📊 Análise técnica detalhada
• ⚡ Alertas em tempo real

🌐 Acesse: ${WEBAPP_URL}

<i>CSI Invest - Sua jornada no trading começa aqui!</i>`

    await this.sendMessage(chatId, welcomeMessage)
  }

  // Comando /help
  async handleHelpCommand(chatId) {
    const helpMessage = `🆘 <b>Central de Ajuda - Sala de Sinais PRO</b>

🎯 <b>Comandos disponíveis:</b>

🚀 <b>/start</b> - Iniciar conversa e ver boas-vindas
🆘 <b>/help</b> - Ver esta mensagem de ajuda
📊 <b>/status</b> - Verificar seu status de assinatura
📝 <b>/cadastro</b> - Como se cadastrar no sistema
💎 <b>/planos</b> - Ver planos e preços disponíveis

📱 <b>Como funciona:</b>
1️⃣ Você se cadastra no nosso sistema
2️⃣ Escolhe um plano (Básico, Pro ou VIP)
3️⃣ Recebe sinais automáticos neste chat
4️⃣ Ganha dinheiro com nossos sinais! 💰

🎯 <b>Tipos de sinais:</b>
• 🪙 Criptomoedas (Bitcoin, Ethereum, etc.)
• 💱 Forex (EUR/USD, GBP/USD, etc.)
• 📈 Ações (Apple, Tesla, etc.)

⚡ <b>Recursos premium:</b>
• Sinais com 3 Take Profits
• Análise técnica detalhada  
• Suporte via WhatsApp
• Comunidade VIP no Telegram

🌐 <b>Site oficial:</b> ${WEBAPP_URL}

❓ <b>Dúvidas?</b> Entre em contato conosco!`

    await this.sendMessage(chatId, helpMessage)
  }

  // Comando /status
  async handleStatusCommand(chatId, userId) {
    try {
      const user = await User.findOne({ telegramId: userId.toString() })
      
      if (!user) {
        await this.sendMessage(chatId, `❌ <b>Usuário não encontrado</b>

Você ainda não está cadastrado em nosso sistema.

📝 Para se cadastrar:
1️⃣ Acesse: ${WEBAPP_URL}
2️⃣ Escolha seu plano
3️⃣ Complete o pagamento
4️⃣ Volte aqui e digite /status

🆘 Digite /cadastro para mais informações`)
        return
      }

      const statusEmoji = user.status === 'active' ? '✅' : user.status === 'expired' ? '⏰' : '❌'
      const planEmoji = user.plan === 'vip' ? '🥇' : user.plan === 'pro' ? '🥈' : '🥉'
      
      let validUntilText = ''
      if (user.validUntil) {
        const validDate = new Date(user.validUntil)
        const now = new Date()
        const daysLeft = Math.ceil((validDate - now) / (1000 * 60 * 60 * 24))
        
        if (daysLeft > 0) {
          validUntilText = `📅 <b>Válido até:</b> ${validDate.toLocaleDateString('pt-BR')} (${daysLeft} dias restantes)`
        } else {
          validUntilText = `📅 <b>Expirado em:</b> ${validDate.toLocaleDateString('pt-BR')}`
        }
      }

      const statusMessage = `📊 <b>SEU STATUS - CSI Invest</b>

👤 <b>Informações da conta:</b>
📧 Email: ${user.email}
👋 Nome: ${user.name || 'Não informado'}
🆔 Telegram ID: ${userId}

📋 <b>Plano atual:</b> ${planEmoji} ${user.plan.toUpperCase()}
🔄 <b>Status:</b> ${statusEmoji} ${user.status.toUpperCase()}
${validUntilText}

${user.status === 'active' ? 
  '🎯 <b>Você está recebendo sinais!</b>\nTodos os sinais são enviados automaticamente para este chat.' :
  '⚠️ <b>Você NÃO está recebendo sinais</b>\nSua assinatura está inativa ou expirada.'}

🔄 <b>Para renovar ou alterar plano:</b>
🌐 Acesse: ${WEBAPP_URL}

📞 <b>Suporte:</b> Entre em contato via WhatsApp`

      await this.sendMessage(chatId, statusMessage)
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error.message)
      await this.sendMessage(chatId, `❌ <b>Erro interno</b>

Não foi possível verificar seu status no momento.
Tente novamente em alguns instantes.

🆘 Se o problema persistir, entre em contato conosco.`)
    }
  }

  // Comando /cadastro
  async handleCadastroCommand(chatId, userInfo) {
    const { userId, firstName } = userInfo

    const cadastroMessage = `📝 <b>COMO SE CADASTRAR</b>

👋 Olá ${firstName}! Para começar a receber nossos sinais:

🎯 <b>Passo a passo:</b>

1️⃣ <b>Acesse nosso site:</b>
🌐 ${WEBAPP_URL}

2️⃣ <b>Escolha seu plano:</b>
🥉 Básico - R$ 29,90/mês
🥈 Pro - R$ 49,90/mês  
🥇 VIP - R$ 89,90/mês

3️⃣ <b>Complete o pagamento</b>
💳 Pix, cartão ou boleto

4️⃣ <b>Configuração automática:</b>
🤖 Seu Telegram ID (${userId}) será vinculado automaticamente
📱 Você começará a receber sinais imediatamente

⚡ <b>Depois do cadastro:</b>
• Digite /status para verificar sua situação
• Receba sinais em tempo real neste chat
• Acesse nossa comunidade VIP

🎁 <b>Bônus especiais:</b>
• 7 dias de garantia
• Suporte prioritário
• Materiais educacionais exclusivos

💎 <b>Digite /planos para ver detalhes completos!</b>

❓ <b>Dúvidas?</b> Fale conosco no WhatsApp!`

    await this.sendMessage(chatId, cadastroMessage)
  }

  // Comando /planos
  async handlePlanosCommand(chatId) {
    const planosMessage = `💎 <b>PLANOS - CSI INVEST</b>

🎯 <b>Escolha o plano ideal para você:</b>

🥉 <b>PLANO BÁSICO - R$ 29,90/mês</b>
• 📈 5-8 sinais por dia
• 🎯 1-2 Take Profits
• 📱 Alertas no Telegram
• 📊 Análise básica

🥈 <b>PLANO PRO - R$ 49,90/mês</b>
• 📈 10-15 sinais por dia
• 🎯 2-3 Take Profits  
• 📱 Alertas prioritários
• 📊 Análise técnica completa
• 💬 Suporte via WhatsApp

🥇 <b>PLANO VIP - R$ 89,90/mês</b>
• 📈 15-20 sinais por dia
• 🎯 3 Take Profits garantidos
• 📱 Alertas em tempo real
• 📊 Análise técnica + fundamentalista
• 💬 Suporte prioritário
• 🏆 Comunidade VIP exclusiva
• 📚 Materiais educacionais
• 🎯 Consultoria personalizada

💳 <b>Formas de pagamento:</b>
• 🔸 Pix (aprovação imediata)
• 💳 Cartão de crédito
• 📄 Boleto bancário

✅ <b>Garantias:</b>
• 7 dias de teste
• Cancelamento a qualquer momento
• Reembolso integral se não se adaptar

🚀 <b>Para assinar:</b>
🌐 Acesse: ${WEBAPP_URL}

📊 <b>Histórico comprovado:</b>
• +85% de assertividade
• +500 clientes satisfeitos
• +2 anos no mercado

💰 <b>Meta mensal:</b> 15-30% de lucro

❓ <b>Ainda com dúvidas?</b> Fale conosco!`

    await this.sendMessage(chatId, planosMessage)
  }

  // Manipular mensagens gerais (não comandos)
  async handleGeneralMessage(chatId, text, userInfo) {
    const { firstName } = userInfo

    // Respostas inteligentes baseadas no conteúdo
    if (text.toLowerCase().includes('preço') || text.toLowerCase().includes('valor')) {
      await this.sendMessage(chatId, `💰 <b>Nossos preços:</b>

🥉 Básico: R$ 29,90/mês
🥈 Pro: R$ 49,90/mês
🥇 VIP: R$ 89,90/mês

Digite /planos para ver todos os detalhes!`)
      return
    }

    if (text.toLowerCase().includes('como funciona') || text.toLowerCase().includes('funciona')) {
      await this.sendMessage(chatId, `🎯 <b>Como funciona:</b>

1️⃣ Você se cadastra no site
2️⃣ Escolhe um plano
3️⃣ Recebe sinais neste chat
4️⃣ Opera seguindo nossas recomendações
5️⃣ Lucra com o trading! 💰

Digite /cadastro para começar!`)
      return
    }

    if (text.toLowerCase().includes('suporte') || text.toLowerCase().includes('ajuda')) {
      await this.sendMessage(chatId, `🆘 <b>Precisa de ajuda?</b>

📱 Digite /help para ver todos os comandos

💬 <b>Contato direto:</b>
• WhatsApp: (11) 99999-9999
• Email: contato@csiinvest.com

🌐 Site: ${WEBAPP_URL}`)
      return
    }

    // Resposta padrão para mensagens não reconhecidas
    await this.sendMessage(chatId, `👋 Olá ${firstName}!

Obrigado por entrar em contato! 

🤖 Eu sou o bot da <b>CSI Invest</b> e estou aqui para ajudar você a receber nossos sinais de trading.

📱 <b>Comandos úteis:</b>
• /start - Começar
• /help - Ver ajuda
• /planos - Ver preços
• /cadastro - Como se cadastrar

❓ Digite um comando ou fale conosco diretamente!`)
  }

  // Obter informações do bot
  async getBotInfo() {
    if (!this.botToken) {
      return { ok: false, error: 'BOT_TOKEN não configurado' }
    }

    try {
      const response = await axios.get(`${this.apiUrl}/getMe`)
      return response.data
    } catch (error) {
      console.error('❌ Erro ao obter info do bot:', error.message)
      return { ok: false, error: error.message }
    }
  }

  // Definir comandos do bot
  async setCommands() {
    if (!this.botToken) {
      console.log('[TelegramBot] BOT_TOKEN não configurado - comandos não definidos')
      return false
    }

    const commands = [
      { command: 'start', description: '🚀 Iniciar conversa' },
      { command: 'help', description: '🆘 Central de ajuda' },
      { command: 'status', description: '📊 Verificar status da conta' },
      { command: 'cadastro', description: '📝 Como se cadastrar' },
      { command: 'planos', description: '💎 Ver planos e preços' }
    ]

    try {
      const response = await axios.post(`${this.apiUrl}/setMyCommands`, {
        commands: commands
      })

      console.log('📋 Comandos do bot configurados:', response.data)
      return response.data.ok
    } catch (error) {
      console.error('❌ Erro ao configurar comandos:', error.message)
      return false
    }
  }
}

export default new TelegramBot()