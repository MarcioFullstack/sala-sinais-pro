import mongoose from 'mongoose'

const SignalSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  direction: { type: String, enum: ['buy', 'sell'], required: true },
  timeframe: { type: String, required: true },
  entry: { type: Number, required: true },
  stop: { type: Number, required: true },
  tps: [{ type: Number }],
  risk: { type: Number, default: 1 },
  reason: String,
  imageUrl: String,
  watermarkedImagePath: String,
  sentAt: { type: Date, default: Date.now },
  sentBy: String,
  telegramMessageId: String,
  status: { type: String, enum: ['active', 'hit_tp1', 'hit_tp2', 'hit_tp3', 'hit_stop', 'closed'], default: 'active' }
}, { timestamps: true })

export default mongoose.models.Signal || mongoose.model('Signal', SignalSchema)