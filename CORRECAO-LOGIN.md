# 🚨 CORREÇÃO LOGIN ADMIN - RENDER

## ❌ PROBLEMA: "Falha no login! Verifique suas credenciais"

### 🔧 SOLUÇÃO: Configurar Environment Variables no Render

## 📋 PASSO-A-PASSO NO RENDER:

### 1️⃣ Vá para o Dashboard do Render
1. Acesse https://dashboard.render.com
2. Clique no seu serviço "sala-sinais-pro"
3. Clique na aba **"Environment"**

### 2️⃣ Adicione EXATAMENTE estas variáveis:

**COPIE E COLE uma por vez:**

```
Nome: NODE_ENV
Valor: production
```

```
Nome: ADMIN_EMAIL  
Valor: admin@csi.invest
```

```
Nome: ADMIN_PASSWORD
Valor: 123456
```

```
Nome: JWT_SECRET
Valor: sala_sinais_jwt_secret_2024_production_key_v2
```

### 3️⃣ Salvar e Redeploy
1. Clique **"Save Changes"**
2. Aguarde o redeploy automático (2-3 minutos)

## 🔍 TESTE APÓS CONFIGURAR:

### URL de Debug:
`https://sala-sinais-pro-dxw0.onrender.com/api/admin/test-config`

**Deve retornar:**
```json
{
  "adminEmailSet": true,
  "adminPasswordSet": true, 
  "jwtSecretSet": true,
  "nodeEnv": "production",
  "expectedEmail": "admin@csi.invest",
  "expectedPassword": "123456"
}
```

### Login Admin:
- **URL:** `https://sala-sinais-pro-dxw0.onrender.com/admin.html`
- **Email:** `admin@csi.invest`
- **Senha:** `123456`

## ⚠️ ATENÇÃO:

- **NÃO** use espaços antes/depois dos valores
- **NÃO** use aspas nos valores  
- **EXATO** como mostrado acima
- Aguarde o redeploy completar

## 📞 SE AINDA NÃO FUNCIONAR:

1. Teste a URL de debug primeiro
2. Verifique os logs do Render
3. Me envie o resultado do test-config