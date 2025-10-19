# Configuração para Render.com

## Variáveis de Ambiente Necessárias:
NODE_ENV=production
ADMIN_EMAIL=admin@csi.invest
ADMIN_PASSWORD=123456
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
PORT=8080

## Comandos do Render:

### Build Command (Comando de construção):
cd backend && npm install

### Start Command (Comando de inicialização):
node backend/server.js

### Pre-deploy Command (Comando de pré-implantação):
cd backend && npm install

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