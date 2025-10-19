import axios from 'axios'
import User from '../models/User.js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID // Canal principal

const sendMessage = async (text, imageUrl = null) => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      console.log('[telegram] BOT_TOKEN ou CHAT_ID não configurados')
      console.log('[telegram] Mensagem que seria enviada:', text)
      return { ok: true, message_id: Date.now(), stub: true }
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
    
    const payload = {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }

    const response = await axios.post(url, payload)
    
    if (response.data.ok) {
      console.log('✅ Mensagem enviada ao Telegram:', response.data.result.message_id)
      return response.data.result
    } else {
      console.error('❌ Erro do Telegram:', response.data)
      return null
    }
  } catch (error) {
    console.error('❌ Erro ao enviar para Telegram:', error.message)
    return null
  }
}

const sendPhoto = async (imageUrl, caption = '') => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      console.log('[telegram] BOT_TOKEN ou CHAT_ID não configurados')
      console.log('[telegram] Foto que seria enviada:', imageUrl, 'Caption:', caption)
      return { ok: true, message_id: Date.now(), stub: true }
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`
    
    const payload = {
      chat_id: CHAT_ID,
      photo: imageUrl,
      caption: caption,
      parse_mode: 'HTML'
    }

    const response = await axios.post(url, payload)
    
    if (response.data.ok) {
      console.log('✅ Foto enviada ao Telegram:', response.data.result.message_id)
      return response.data.result
    } else {
      console.error('❌ Erro do Telegram (foto):', response.data)
      return null
    }
  } catch (error) {
    console.error('❌ Erro ao enviar foto para Telegram:', error.message)
    return null
  }
}

// Enviar mensagem para um usuário específico
const sendPrivateMessage = async (telegramId, text, imageUrl = null) => {
  try {
    if (!BOT_TOKEN) {
      console.log('[telegram] BOT_TOKEN não configurado')
      console.log('[telegram] Mensagem privada que seria enviada para', telegramId, ':', text)
      return { ok: true, message_id: Date.now(), stub: true }
    }

    if (imageUrl && imageUrl.startsWith('http')) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`
      const payload = {
        chat_id: telegramId,
        photo: imageUrl,
        caption: text,
        parse_mode: 'HTML'
      }
      const response = await axios.post(url, payload)
      if (response.data.ok) {
        console.log(`✅ Foto privada enviada para ${telegramId}:`, response.data.result.message_id)
        return response.data.result
      }
    } else {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
      const payload = {
        chat_id: telegramId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      }
      const response = await axios.post(url, payload)
      if (response.data.ok) {
        console.log(`✅ Mensagem privada enviada para ${telegramId}:`, response.data.result.message_id)
        return response.data.result
      }
    }
    
    console.error('❌ Erro ao enviar mensagem privada:', response?.data)
    return null
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem privada para ${telegramId}:`, error.message)
    return null
  }
}

// Enviar sinal para todos os usuários ativos
const broadcastSignal = async (signalText, imageUrl = null) => {
  try {
    console.log('📡 Iniciando broadcast de sinal para usuários...')
    
    // Buscar todos os usuários ativos com telegramId
    let activeUsers = []
    try {
      activeUsers = await User.find({
        status: 'active',
        telegramId: { $exists: true, $ne: null, $ne: '' }
      }).select('telegramId email name plan')
      
      console.log(`📊 Encontrados ${activeUsers.length} usuários ativos com Telegram`)
    } catch (dbError) {
      console.warn('⚠️ MongoDB não conectado para buscar usuários:', dbError.message)
      // Se não há DB, enviar apenas para o canal principal
      return await sendMessage(signalText, imageUrl)
    }

    const results = {
      channel: null,
      users: [],
      success: 0,
      failed: 0,
      total: activeUsers.length
    }

    // Primeiro, enviar para o canal principal
    try {
      results.channel = await sendMessage(signalText, imageUrl)
      if (results.channel) {
        console.log('✅ Sinal enviado para canal principal')
      }
    } catch (channelError) {
      console.error('❌ Erro ao enviar para canal principal:', channelError.message)
    }

    // Depois, enviar para cada usuário individual
    for (const user of activeUsers) {
      try {
        const userSignal = `👤 <b>${user.name || user.email}</b>\n\n${signalText}`
        const result = await sendPrivateMessage(user.telegramId, userSignal, imageUrl)
        
        if (result) {
          results.success++
          results.users.push({
            email: user.email,
            telegramId: user.telegramId,
            success: true,
            messageId: result.message_id
          })
        } else {
          results.failed++
          results.users.push({
            email: user.email,
            telegramId: user.telegramId,
            success: false,
            error: 'Failed to send'
          })
        }
        
        // Delay entre envios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (userError) {
        console.error(`❌ Erro ao enviar para ${user.email}:`, userError.message)
        results.failed++
        results.users.push({
          email: user.email,
          telegramId: user.telegramId,
          success: false,
          error: userError.message
        })
      }
    }

    console.log(`📊 Broadcast concluído: ${results.success} sucessos, ${results.failed} falhas de ${results.total} usuários`)
    return results
    
  } catch (error) {
    console.error('❌ Erro no broadcast de sinal:', error.message)
    return {
      error: error.message,
      success: 0,
      failed: 0,
      total: 0
    }
  }
}

export default { 
  sendMessage, 
  sendPhoto, 
  sendPrivateMessage, 
  broadcastSignal 
}
