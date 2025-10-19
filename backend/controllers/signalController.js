import Signal from '../models/Signal.js'
import axios from 'axios'
import Jimp from 'jimp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../../public/uploads')
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive:true })

function formatSignal(s){
  const tps = (s.tps||[]).map((n,i)=>`🎯 TP${i+1}: ${n}`).join('\n')
  return [
    `📣 SINAL — ${s.symbol}`,
    `▶ Tipo: ${s.direction.toUpperCase()}`,
    `⏱ TF: ${s.timeframe}`,
    `📍 Entrada: ${s.entry}`,
    `⚠️ SL: ${s.stop}`,
    tps,
    `💎 Risco: ${s.risk || 1}%`,
    `🔎 Motivo: ${s.reason || '-'}`,
    `🕒 ${new Date(s.sentAt||Date.now()).toLocaleString('pt-BR')}`
  ].filter(Boolean).join('\n')
}

async function watermarkImageFromUrl(url){
  try{
    const image = await Jimp.read(url)
    const w = image.bitmap.width
    const h = image.bitmap.height
    const margin = Math.round(Math.min(w,h)*0.02)
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
    const text = `CSI Invest — Sala de Sinais PRO`
    const textW = Jimp.measureText(font, text)
    const textH = Jimp.measureTextHeight(font, text, w)
    // Semi-transparent bar
    const barH = textH + margin*1.5
    const bar = new Jimp(w, barH, 0x00000080) // black 50%
    image.composite(bar, 0, h - barH)
    image.print(font, w - textW - margin, h - barH + (barH-textH)/2, text)

    const fname = `wm_${Date.now()}.jpg`
    const fpath = path.join(uploadsDir, fname)
    await image.quality(85).writeAsync(fpath)
    return `/uploads/${fname}`
  }catch(e){
    console.error('watermark error', e.message)
    return null
  }
}

export async function createSignal(req, res){
  try{
    const s = await Signal.create(req.body)
    const caption = formatSignal(s)
    let photoUrl = s.imageUrl

    if(photoUrl){
      const wmRel = await watermarkImageFromUrl(photoUrl)
      if(wmRel){
        // serve static: /uploads/...
        photoUrl = `${process.env.PUBLIC_URL || ''}${wmRel}`.replace(/\/$/,'') // join if PUBLIC_URL set
      }
    }

    if(photoUrl){
      await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
        chat_id: CHANNEL_ID,
        photo: photoUrl,
        caption
      })
    }else{
      await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        chat_id: CHANNEL_ID,
        text: caption,
        parse_mode: 'HTML'
      })
    }
    res.json({ ok: true, signal: s })
  }catch(err){
    console.error(err)
    res.status(500).json({ error: 'Falha ao criar/enviar sinal' })
  }
}

export async function tradingviewWebhook(req, res){
  try{
    const p = req.body || {}
    const payload = {
      symbol: p.symbol || p.SYMBOL || 'BTC/USDT',
      direction: (p.side || p.SIDE || 'buy').toLowerCase(),
      timeframe: p.tf || p.timeframe || '1H',
      entry: Number(p.entry || p.price || 0),
      stop: Number(p.stop || 0),
      tps: Array.isArray(p.tps) ? p.tps.map(Number) : [Number(p.tp1||0), Number(p.tp2||0)].filter(Boolean),
      risk: Number(p.risk || 1),
      reason: p.reason || 'TV alert',
      sentAt: new Date(),
      imageUrl: p.imageUrl || null
    }
    req.body = payload
    return createSignal(req, res)
  }catch(err){
    console.error(err)
    res.status(500).json({ error: 'Falha no webhook TradingView' })
  }
}
