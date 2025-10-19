# 🚀 Sala de Sinais PRO

Sistema completo para gerenciamento de sala de sinais de trading com integração ao Telegram e Mercado Pago.

## ✨ Funcionalidades

- 🎨 **Interface Moderna**: Design responsivo com logo CSI INVEST
- 🔐 **Sistema de Admin**: Painel administrativo completo
- 📊 **Envio de Sinais**: Integração com Telegram Bot
- 💳 **Pagamentos**: Integração com Mercado Pago
- 👥 **Gestão de Usuários**: CRUD completo de usuários
- 📱 **Responsivo**: Funciona em desktop, tablet e mobile
- 🛡️ **Segurança**: JWT, Helmet, CORS

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- MongoDB/Mongoose (opcional)
- JWT para autenticação
- Telegram Bot API
- Mercado Pago API
- Helmet para segurança

### Frontend
- HTML5 + CSS3 + JavaScript Vanilla
- CSS Grid + Flexbox
- Inter Font (Google Fonts)
- Design System moderno

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sala-sinais-pro.git
cd sala-sinais-pro
```

### 2. Instale as dependências
```bash
cd backend
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
ADMIN_EMAIL=admin@csi.invest
ADMIN_PASSWORD=sua_senha_segura
JWT_SECRET=seu_jwt_secret_super_seguro
```

### 4. Inicie o servidor
```bash
npm start
```

### 5. Acesse a aplicação
- **Landing Page**: http://localhost:8080
- **Painel Admin**: http://localhost:8080/admin.html

## 🔑 Credenciais Padrão

- **Email**: `admin@csi.invest`
- **Senha**: `123456` (altere no arquivo `.env`)

## 📁 Estrutura do Projeto

```
sala-sinais-pro/
├── backend/
│   ├── controllers/         # Controllers das APIs
│   ├── middleware/          # Middlewares (auth, etc)
│   ├── models/             # Modelos do MongoDB
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços (Telegram, etc)
│   ├── server.js           # Servidor principal
│   ├── package.json        # Dependências backend
│   └── .env.example        # Exemplo de configuração
├── frontend/
│   ├── index.html          # Landing page
│   ├── admin.html          # Painel administrativo
│   ├── styles.css          # Estilos responsivos
│   └── script.js           # JavaScript frontend
├── public/
│   └── uploads/            # Uploads de usuários
└── README.md
```

## 🎯 Principais Rotas da API

### Admin
- `POST /api/admin/login` - Login do admin
- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `PATCH /api/admin/users/:id` - Atualizar usuário
- `DELETE /api/admin/users/:id` - Excluir usuário

### Sinais
- `POST /api/signals` - Enviar sinal ao Telegram

### Leads
- `POST /api/leads` - Capturar lead da landing page

### Pagamentos
- `POST /api/mp/checkout/subscribe` - Criar assinatura MP

## 🔧 Configuração Avançada

### MongoDB (Opcional)
Se quiser usar MongoDB em vez do modo stub:
```env
MONGO_URI=mongodb://localhost:27017/sala-sinais-pro
```

### Telegram Bot
1. Crie um bot no @BotFather
2. Configure no `.env`:
```env
TELEGRAM_BOT_TOKEN=seu_bot_token
TELEGRAM_CHAT_ID=seu_chat_id
```

### Mercado Pago
1. Obtenha suas credenciais no painel MP
2. Configure no `.env`:
```env
MP_ACCESS_TOKEN=seu_access_token
```

## 📱 Design Responsivo

O sistema é totalmente responsivo com breakpoints:
- 📱 Mobile: 360px - 767px
- 📟 Tablet: 768px - 1023px  
- 💻 Desktop: 1024px+

## 🛡️ Segurança

- JWT para autenticação
- Helmet para headers de segurança
- CORS configurado
- CSP (Content Security Policy)
- Validação de entrada

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do email: admin@csi.invest