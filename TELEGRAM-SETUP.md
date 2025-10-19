# 🤖 Configuração do Bot Telegram - Sala de Sinais PRO

## 📋 Pré-requisitos

1. **Conta no Telegram**
2. **Acesso ao @BotFather**
3. **Canal ou Grupo do Telegram criado**

## 🛠️ Passo a Passo para Configuração

### 1️⃣ Criar o Bot no Telegram

1. **Abra o Telegram** e procure por `@BotFather`
2. **Inicie conversa** com `/start`
3. **Crie novo bot** com `/newbot`
4. **Escolha um nome** para o bot (ex: "Sala de Sinais PRO Bot")
5. **Escolha username** único (ex: "SalaSinaisProBot")
6. **Copie o TOKEN** fornecido pelo BotFather

```
Exemplo de token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2️⃣ Criar Canal/Grupo para Sinais

1. **Crie um canal** no Telegram (ex: "🚀 Sala de Sinais PRO")
2. **Adicione o bot** como administrador do canal
3. **Obtenha o Chat ID** do canal:
   - Envie uma mensagem no canal
   - Acesse: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Procure pelo "chat_id" (será negativo para canais)

```
Exemplo de Chat ID: -1001234567890
```

### 3️⃣ Configurar Variáveis de Ambiente

**No Render.com:**
1. Acesse seu serviço no dashboard
2. Vá em **Environment**
3. Adicione as variáveis:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
```

**Localmente (.env):**
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
```

### 4️⃣ Configurar Usuários para Receber Sinais

**No Painel Admin:**
1. Acesse `https://seu-site.com/admin.html`
2. Login: `admin@csi.invest` / `123456`
3. Vá na seção **"📱 Telegram - Estatísticas e Testes"**
4. Na tabela de usuários, adicione o **Telegram ID** de cada cliente

**Como obter Telegram ID dos usuários:**
1. Usuário deve enviar `/start` para seu bot
2. Acesse: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Procure pelo "chat_id" da conversa (será positivo para usuários)

## 🧪 Testando o Sistema

### Teste Básico no Admin
1. Acesse a seção **"📱 Telegram"** no admin
2. Clique em **"🔄 Atualizar Estatísticas"**
3. Digite uma mensagem de teste
4. Escolha o tipo de envio:
   - **📢 Canal Principal**: Apenas para o canal
   - **📡 Broadcast**: Canal + todos os usuários ativos
   - **👤 Privado**: Para um usuário específico
5. Clique em **"📤 Testar Envio"**

### Teste de Sinal Completo
1. Vá para a seção **"📡 Enviar Sinal"**
2. Preencha todos os campos:
   - **Symbol**: BTCUSDT
   - **Direction**: buy ou sell
   - **Timeframe**: 1H, 4H, 1D
   - **Entry**: Preço de entrada
   - **Stop**: Stop loss
   - **Take Profits**: 67800, 69500, 72000
   - **Análise**: Motivo do sinal
3. Clique em **"📤 Enviar Sinal ao Telegram"**

## 📊 Monitoramento

### Estatísticas Disponíveis
- **Usuários Totais**: Todos os usuários cadastrados
- **Com Telegram**: Usuários que têm Telegram ID configurado
- **Ativos + Telegram**: Usuários ativos que receberão sinais

### Logs do Sistema
```bash
# Sucesso
✅ Mensagem enviada ao Telegram: 12345
📡 Broadcast concluído: 15 sucessos, 0 falhas de 15 usuários

# Modo Stub (sem configuração)
⚠️ TELEGRAM_BOT_TOKEN não configurado
[telegram] Mensagem que seria enviada: [conteúdo]
```

## 🔧 Solução de Problemas

### Bot não envia mensagens
1. ✅ Verifique se o TOKEN está correto
2. ✅ Confirme se o bot é admin do canal
3. ✅ Teste o token: `https://api.telegram.org/bot<TOKEN>/getMe`

### Usuários não recebem mensagens privadas
1. ✅ Usuário deve enviar `/start` para o bot primeiro
2. ✅ Confirme se o Telegram ID está correto
3. ✅ Verifique se o usuário não bloqueou o bot

### Canal ID não funciona
1. ✅ Use Chat ID negativo para canais (ex: -1001234567890)
2. ✅ Use Chat ID positivo para usuários (ex: 123456789)
3. ✅ Bot deve ser administrador do canal

## 🚀 Funcionalidades Implementadas

### ✅ Broadcast Inteligente
- Envia para canal principal
- Envia mensagem personalizada para cada usuário ativo
- Controle de rate limiting entre envios
- Relatório detalhado de sucessos/falhas

### ✅ Mensagens Privadas
- Envio individual para usuários específicos
- Personalização por usuário (nome no cabeçalho)
- Fallback para canal se falhar envio privado

### ✅ Formatação Rica
- Emojis e formatação HTML
- Informações completas do sinal
- Timestamp e branding
- Suporte a imagens de gráficos

### ✅ Gestão no Admin
- Estatísticas em tempo real
- Teste de envio integrado
- Gerenciamento de Telegram ID dos usuários
- Monitoramento de cobertura

## 📱 Exemplo de Sinal Formatado

```
📣 SINAL — BTCUSDT

▶ Tipo: 🟢 COMPRA
⏱ Timeframe: 4H
📍 Entrada: 67500
⚠️ Stop Loss: 66800

🎯 TP1: 68200
🎯 TP2: 69500
🎯 TP3: 72000

💎 Risco: 2%

🔎 Análise: Rompimento de resistência + RSI divergente + Volume crescente

🕒 19/10/2025 14:30:45

📈 CSI Invest — Sala de Sinais PRO
```

## 🔐 Segurança

- ✅ Tokens armazenados como variáveis de ambiente
- ✅ Validação de usuários ativos antes do envio
- ✅ Rate limiting para evitar spam
- ✅ Logs detalhados para auditoria
- ✅ Fallback graceful quando Telegram não está configurado

---

📞 **Suporte**: Para dúvidas sobre configuração, consulte os logs do sistema ou teste as funcionalidades no painel admin.