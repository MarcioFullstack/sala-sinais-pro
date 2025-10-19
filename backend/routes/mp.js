import express from 'express'
import { mpCreateCheckout, mpCreatePreapproval, mpCancelPreapproval } from '../controllers/paymentMPController.js'
import { auth } from '../middleware/auth.js'
const router = express.Router()

router.get('/start', mpCreateCheckout)
router.post('/subscribe', auth, mpCreatePreapproval)
router.post('/subscribe/cancel/:userId', auth, mpCancelPreapproval)

export default router
