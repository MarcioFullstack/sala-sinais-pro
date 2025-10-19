import express from 'express'
import Signal from '../models/Signal.js'
import Telegram from '../services/telegram.js'

const router = express.Router()

function formatSignal(s) {
  const tps = (s.tps || []).map((n, i) => `🎯 TP${i + 1}: ${n}`).join('\n')
  const direction = s.direction === 'buy' ? '🟢 COMPRA' : '🔴 VENDA'
  
  return [
    `📣 <b>SINAL — ${s.symbol}</b>`,
    ``,
    `▶ <b>Tipo:</b> ${direction}`,
    `⏱ <b>Timeframe:</b> ${s.timeframe}`,
    `📍 <b>Entrada:</b> ${s.entry}`,
    `⚠️ <b>Stop Loss:</b> ${s.stop}`,
    tps ? `\n${tps}` : '',
    `💎 <b>Risco:</b> ${s.risk || 1}%`,
    s.reason ? `\n🔎 <b>Análise:</b> ${s.reason}` : '',
    ``,
    `🕒 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    ``,
    `📈 <i>CSI Invest — Sala de Sinais PRO</i>`
  ].filter(Boolean).join('\n')
}

// Send a signal
router.post('/', async (req, res) => {
  try {
    const { symbol, direction, timeframe, entry, stop, tps, reason, imageUrl, risk } = req.body || {}
    
    // Validation
    if (!symbol || !direction || !timeframe || !entry || !stop) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: symbol, direction, timeframe, entry, stop' 
      })
    }

    if (!['buy', 'sell'].includes(direction)) {
      return res.status(400).json({ error: 'Direction deve ser "buy" ou "sell"' })
    }

    // Create signal object
    const signalData = {
      symbol: symbol.toUpperCase(),
      direction,
      timeframe,
      entry: Number(entry),
      stop: Number(stop),
      tps: Array.isArray(tps) ? tps.map(Number) : (typeof tps === 'string' ? tps.split(',').map(t => Number(t.trim())) : []),
      reason: reason || '',
      imageUrl: imageUrl || '',
      risk: Number(risk) || 1,
      sentBy: req.user?.email || 'admin',
      sentAt: new Date()
    }

    // Save to database (if MongoDB is connected)
    let savedSignal = null
    try {
      savedSignal = new Signal(signalData)
      await savedSignal.save()
    } catch (dbError) {
      console.warn('⚠️ MongoDB não conectado, sinal não salvo:', dbError.message)
      // Continue even if DB save fails
    }

    // Format message for Telegram
    const message = formatSignal(signalData)
    
    // Send to Telegram (canal + usuários individuais)
    let telegramResult = null
    try {
      telegramResult = await Telegram.broadcastSignal(message, imageUrl)
      console.log('📡 Resultado do broadcast:', {
        channel: telegramResult.channel ? '✅' : '❌',
        users: `${telegramResult.success}/${telegramResult.total} usuários`
      })
    } catch (telegramError) {
      console.error('❌ Erro ao fazer broadcast:', telegramError.message)
    }

    // Update signal with telegram message ID if saved
    if (savedSignal && telegramResult && telegramResult.channel && telegramResult.channel.message_id) {
      try {
        savedSignal.telegramMessageId = telegramResult.channel.message_id.toString()
        await savedSignal.save()
      } catch (updateError) {
        console.warn('⚠️ Não foi possível atualizar message_id:', updateError.message)
      }
    }

    console.log('✅ Sinal processado:', symbol, direction, '- Telegram:', telegramResult ? '✅' : '❌')
    
    res.json({ 
      ok: true, 
      signal: signalData,
      telegram: {
        channel: telegramResult?.channel ? true : false,
        users: {
          success: telegramResult?.success || 0,
          failed: telegramResult?.failed || 0,
          total: telegramResult?.total || 0
        }
      },
      telegramMessageId: telegramResult?.channel?.message_id,
      saved: savedSignal ? true : false
    })

  } catch (error) {
    console.error('❌ Erro ao processar sinal:', error.message)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Get recent signals
router.get('/', async (req, res) => {
  try {
    const signals = await Signal.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v')
    
    res.json(signals)
  } catch (error) {
    console.warn('⚠️ Erro ao buscar sinais (MongoDB):', error.message)
    res.json([]) // Return empty array if DB not available
  }
})

export default router
