
## Guia de Deploy (Hostinger/VPS/Vercel/Render) + NGINX/HTTPS

### VPS/Hostinger (Node + NGINX + PM2)
1. **Servidor**
   ```bash
   sudo apt update && sudo apt install -y nginx git curl
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm i -g pm2
   ```
2. **Clonar e configurar**
   ```bash
   git clone <repo_ou_upload> sala-sinais-pro && cd sala-sinais-pro/backend
   cp .env.csi.example .env  # edite chaves e URLs
   npm i
   pm2 start server.js --name sala-sinais-api
   pm2 save && pm2 startup
   ```
3. **NGINX (reverse proxy)**
   ```nginx
   server {
     listen 80;
     server_name salasinais.seudominio.com;

     location / {
       proxy_pass http://127.0.0.1:8080;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/salasinais /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. **HTTPS (Certbot)**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d salasinais.seudominio.com
   ```

### Render.com (Backend) + Vercel (Frontend, opcional)
- Backend: deploy como Web Service (Node 18), defina as variáveis do `.env` no painel.
- Frontend: se quiser separar, faça deploy do `frontend/` na Vercel e aponte para `/api/...` do backend.

### Hotfixes comuns
- **PUBLIC_URL** precisa apontar para o domínio (para compor URL das imagens com watermark).
- **Telegram**: Promova o bot a admin do canal privado.
- **Stripe/MP**: Garanta webhooks configurados e segredos corretos.
