# Estrutura do Projeto Sala de Sinais PRO

## Frontend
- `frontend/index.html` — Página principal
- `frontend/styles.css` — Estilos centralizados
- `frontend/script.js` — Scripts JS
- `frontend/educativo.html` — Conteúdo educativo
- `frontend/admin.html` — Painel admin
- `frontend/privacidade.html`, `termos.html`, etc.

## Backend
- `backend/server.js` — Servidor Express
- `backend/controllers/` — Lógica de negócio
- `backend/models/` — Modelos de dados
- `backend/routes/` — Rotas da API
- `backend/middleware/` — Middlewares
- `backend/services/` — Integrações externas

## Público
- `public/uploads/` — Vídeos e arquivos de mídia

## Configuração
- `.env`, `.env.example` — Variáveis de ambiente
- `.gitignore`, `.renderignore` — Controle de arquivos no deploy
- `README.md` — Documentação principal
- `docs/` — Documentação adicional

## Scripts
- `atualizar-github.bat`, `deploy-rapido.sh`, etc. — Automação de deploy

## Testes
- `test-deploy.js`, `test-server.js`, etc. — Testes automatizados

---

> Para garantir funcionamento, mantenha os arquivos de mídia em `public/uploads/` e revise as variáveis de ambiente no `.env`.
> Consulte o README.md para instruções de uso e deploy.