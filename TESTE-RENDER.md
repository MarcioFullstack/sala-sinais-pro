# TESTE DE CONECTIVIDADE - RENDER

## 🔍 URLs para Testar:

### 1️⃣ Health Check:
```
https://sala-sinais-pro-dxw0.onrender.com/health
```
**Deve retornar:** JSON com status "OK"

### 2️⃣ Debug Admin:
```
https://sala-sinais-pro-dxw0.onrender.com/debug/admin
```
**Deve retornar:** Informações de configuração

### 3️⃣ Landing Page:
```
https://sala-sinais-pro-dxw0.onrender.com/
```
**Deve mostrar:** Página principal com CSI INVEST

### 4️⃣ Admin Panel:
```
https://sala-sinais-pro-dxw0.onrender.com/admin.html
```
**Deve mostrar:** Tela de login do admin

### 5️⃣ API Test:
```
https://sala-sinais-pro-dxw0.onrender.com/api/admin/test
```
**Deve retornar:** Erro 401 (normal, precisa login)

---

## 🚨 PROBLEMAS COMUNS:

### ❌ Erro 404:
- Build falhou
- Arquivos não encontrados
- Limpe cache no Render

### ❌ Erro 500:
- Environment variables não configuradas
- Verifique logs do Render

### ❌ Página em branco:
- CSP muito restritivo
- JavaScript não carregou

### ❌ "Application Error":
- Processo não iniciou
- Comando de start incorreto

---

## 🔧 COMO TESTAR:

1. **Abra cada URL** no navegador
2. **Anote quais funcionam** e quais dão erro
3. **Verifique os logs** no Render Dashboard
4. **Me informe os resultados**

## 📋 CHECKLIST:

- [ ] Health check responde?
- [ ] Debug admin funciona?
- [ ] Landing page carrega?
- [ ] Admin.html aparece?
- [ ] Qual URL exata do Render?