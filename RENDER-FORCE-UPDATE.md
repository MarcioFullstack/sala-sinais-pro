# RENDER DEPLOY TRIGGER - v2.0

## 🔄 FORÇAR NOVO DEPLOY NO RENDER

Se o admin não está funcionando, siga estes passos:

### 1️⃣ No Render Dashboard:
1. Vá para seu serviço "sala-sinais-pro"
2. Clique em "Settings" (Configurações)
3. Role até "Build & Deploy"
4. Clique em "Clear build cache" (Limpar cache)
5. Clique em "Manual Deploy" → "Clear cache and deploy"

### 2️⃣ Variáveis de Ambiente (RECONFIGURAR):
```
NODE_ENV=production
ADMIN_EMAIL=admin@csi.invest
ADMIN_PASSWORD=123456
JWT_SECRET=sala_sinais_jwt_secret_2024_production_key_v2
```

### 3️⃣ Comandos do Render (ATUALIZAR):
- **Build Command:** `cd backend && npm install --production`
- **Start Command:** `node backend/server.js`

### 4️⃣ Testar Após Deploy:
- Health: https://sala-sinais-pro-dxw0.onrender.com/health
- Admin: https://sala-sinais-pro-dxw0.onrender.com/admin.html
- Landing: https://sala-sinais-pro-dxw0.onrender.com/

### 🔧 Se Ainda Não Funcionar:
1. Delete o serviço no Render
2. Crie um novo conectando o GitHub novamente
3. Use as configurações acima

---
**Deploy Timestamp:** $(date)
**Version:** 2.0 - Force Update