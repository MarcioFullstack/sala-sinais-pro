# 🚀 DEPLOY AUTOMÁTICO - RENDER

## ⚡ CONFIGURAÇÃO RÁPIDA - 5 MINUTOS

### 1️⃣ ACESSE O RENDER:
👉 https://dashboard.render.com

### 2️⃣ CRIAR NOVO SERVIÇO:
1. Clique **"New +"** → **"Web Service"**
2. Conecte sua conta GitHub (se não conectado)
3. Escolha repositório: **"MarcioFullstack/sala-sinais-pro"**
4. Clique **"Connect"**

### 3️⃣ CONFIGURAÇÕES EXATAS:

**Nome:** `sala-sinais-pro`
**Root Directory:** (deixe vazio)
**Environment:** `Node`
**Region:** `Oregon (US West)` (mais barato)
**Branch:** `main`

**Build Command:**
```
cd backend && npm install --production
```

**Start Command:**  
```
node backend/server.js
```

### 4️⃣ PLANO:
Escolha **"Free"** (suficiente para testes e MVP)

### 5️⃣ ENVIRONMENT VARIABLES:
Clique **"Advanced"** → **"Add Environment Variable"**

**Adicione UMA POR VEZ:**

```
NODE_ENV → production
ADMIN_EMAIL → admin@csi.invest  
ADMIN_PASSWORD → 123456
JWT_SECRET → sala_sinais_jwt_secret_2024_production_key_v2
```

### 6️⃣ DEPLOY:
1. Clique **"Create Web Service"**
2. Aguarde 3-5 minutos
3. Render mostrará URL do tipo: `https://sala-sinais-pro-xxxxx.onrender.com`

## ✅ TESTE IMEDIATO:

### Health Check:
`https://SUA-URL.onrender.com/health`

### Landing Page:
`https://SUA-URL.onrender.com/`

### Admin Panel:
`https://SUA-URL.onrender.com/admin.html`
- Email: `admin@csi.invest`
- Senha: `123456`

## 🎯 SUCESSO:
Sua aplicação estará funcionando em menos de 10 minutos!