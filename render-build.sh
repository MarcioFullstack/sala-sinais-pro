#!/bin/bash

# Deploy otimizado para Render - Sala de Sinais PRO
echo "🚀 Iniciando deploy otimizado..."

# Configurar cache do NPM
echo "📦 Configurando cache NPM..."
npm config set cache /tmp/.npm --global
export NPM_CONFIG_CACHE=/tmp/.npm
export NPM_CONFIG_PREFER_OFFLINE=true
export NPM_CONFIG_NO_AUDIT=true
export NPM_CONFIG_FUND=false
export NPM_CONFIG_LOGLEVEL=error

# Navegar para backend
echo "📁 Navegando para diretório backend..."
cd backend || exit 1

# Verificar se package-lock.json existe
if [ ! -f "package-lock.json" ]; then
    echo "📋 Gerando package-lock.json..."
    npm install --package-lock-only --silent
fi

# Instalar dependências de produção com cache
echo "⏬ Instalando dependências (modo produção)..."
npm ci --only=production --silent --no-audit --no-fund

# Verificar instalação
if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro na instalação de dependências"
    exit 1
fi

# Listar dependências instaladas para debug
echo "📊 Dependências instaladas:"
npm list --depth=0 --only=production --silent

echo "🎉 Deploy build concluído com sucesso!"