import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: String,
  plan: { type: String, default: 'basic', index: true },
  telegramId: { type: String, default: null, index: true },
  status: { type: String, default: 'active', index: true },
  validUntil: { type: Date, default: null },
  preapprovalId: { type: String, default: null },
  source: { type: String, default: 'direct', index: true } // landing_page, admin, api, etc.
}, { timestamps: true })

// Índices compostos para consultas otimizadas
UserSchema.index({ email: 1, status: 1 })
UserSchema.index({ plan: 1, status: 1 })
UserSchema.index({ source: 1, createdAt: -1 })

export default mongoose.models.User || mongoose.model('User', UserSchema)
