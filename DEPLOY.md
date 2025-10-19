# 🚀 Deploy no Render - Sala de Sinais PRO

## ⚙️ Configuração Automática
O arquivo `render.yaml` já está configurado! O Render detectará automaticamente.

## 🔧 Comandos do Render

### Build Command (Comando de construção):
```bash
cd backend && npm install
```

### Start Command (Comando de inicialização):
```bash
node backend/server.js
```

### Pre-deploy Command (Comando de pré-implantação):
```bash
cd backend && npm install
```

## 🔐 Variáveis de Ambiente Necessárias

**COPIE E COLE NO RENDER:**
```
NODE_ENV=production
ADMIN_EMAIL=admin@csi.invest
ADMIN_PASSWORD=123456
JWT_SECRET=sala_sinais_jwt_secret_2024_production_key
```

## 🩺 Health Check
- URL: `/health`
- Verifica se a aplicação está funcionando

## Configurações Automáticas:
- ✅ Auto-deploy habilitado
- ✅ Healthcheck configurado
- ✅ Environment variables prontas
- ✅ Node.js 18+ especificado

## Deploy Manual:
1. Conecte o repositório GitHub no Render
2. Use as configurações acima
3. Deploy automático será feito

## URLs após deploy:
- Landing page: https://seu-app.onrender.com/
- Admin: https://seu-app.onrender.com/admin.html
- API: https://seu-app.onrender.com/api/