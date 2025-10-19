import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// Rota de teste simples para login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {}
  console.log('Login attempt:', { email, password })
  console.log('Expected:', { 
    email: process.env.ADMIN_EMAIL, 
    password: process.env.ADMIN_PASSWORD 
  })
  
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    console.log('✅ Login successful')
    return res.json({ token: 'test-token-123' })
  }
  
  console.log('❌ Login failed')
  return res.status(401).json({ error: 'Credenciais inválidas' })
})

// Serve static files
app.use(express.static('../frontend'))

const port = 8080
app.listen(port, () => {
  console.log(`🚀 Simple test server running on http://localhost:${port}`)
  console.log(`Admin credentials: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`)
})