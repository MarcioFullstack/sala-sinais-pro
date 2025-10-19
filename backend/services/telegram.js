import axios from 'axios'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

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

export default { sendMessage, sendPhoto }
