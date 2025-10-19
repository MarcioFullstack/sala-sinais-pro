import express from 'express'
import TelegramBot from '../services/telegramBot.js'

const router = express.Router()

// Webhook do Telegram - recebe mensagens do bot
router.post('/telegram', async (req, res) => {
  try {
    console.log('📱 Webhook Telegram recebido:', JSON.stringify(req.body, null, 2))
    
    const { message, callback_query } = req.body

    // Processar mensagem normal
    if (message) {
      await TelegramBot.processMessage(message)
    }

    // Processar callback de botão inline (para futuras implementações)
    if (callback_query) {
      console.log('🔘 Callback query recebido:', callback_query)
      // Implementar lógica de callback se necessário
    }

    // Responder OK para o Telegram
    res.status(200).json({ ok: true })
    
  } catch (error) {
    console.error('❌ Erro no webhook do Telegram:', error.message)
    res.status(200).json({ ok: false, error: error.message })
  }
})

// Configurar webhook (rota administrativa)
router.post('/telegram/setup', async (req, res) => {
  try {
    const { webhookUrl } = req.body
    
    if (!webhookUrl) {
      return res.status(400).json({ 
        error: 'webhookUrl é obrigatório',
        example: 'https://seu-dominio.com/api/webhook/telegram'
      })
    }

    // Configurar webhook
    const success = await TelegramBot.setWebhook(webhookUrl)
    
    if (success) {
      // Também configurar comandos do bot
      await TelegramBot.setCommands()
      
      res.json({
        ok: true,
        message: 'Webhook e comandos configurados com sucesso',
        webhookUrl: webhookUrl
      })
    } else {
      res.status(500).json({
        ok: false,
        error: 'Falha ao configurar webhook'
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Remover webhook
router.delete('/telegram/webhook', async (req, res) => {
  try {
    const success = await TelegramBot.deleteWebhook()
    
    if (success) {
      res.json({
        ok: true,
        message: 'Webhook removido com sucesso'
      })
    } else {
      res.status(500).json({
        ok: false,
        error: 'Falha ao remover webhook'
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao remover webhook:', error.message)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Obter informações do bot
router.get('/telegram/info', async (req, res) => {
  try {
    const botInfo = await TelegramBot.getBotInfo()
    res.json(botInfo)
  } catch (error) {
    console.error('❌ Erro ao obter info do bot:', error.message)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Testar envio de mensagem via bot
router.post('/telegram/test', async (req, res) => {
  try {
    const { chatId, message } = req.body
    
    if (!chatId || !message) {
      return res.status(400).json({ 
        error: 'chatId e message são obrigatórios' 
      })
    }

    const result = await TelegramBot.sendMessage(chatId, message)
    
    res.json({
      ok: result ? true : false,
      result: result,
      sent: result ? true : false
    })
    
  } catch (error) {
    console.error('❌ Erro no teste do bot:', error.message)
    res.status(500).json({ ok: false, error: error.message })
  }
})

export default router