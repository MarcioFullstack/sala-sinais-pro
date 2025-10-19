import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  plan: { type: String, default: 'basic' },
  telegramId: { type: String, default: null },
  status: { type: String, default: 'active' },
  validUntil: { type: Date, default: null },
  preapprovalId: { type: String, default: null },
  source: { type: String, default: 'direct' } // landing_page, admin, api, etc.
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)
