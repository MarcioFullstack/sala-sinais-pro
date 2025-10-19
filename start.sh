#!/bin/bash
# Script para instalar dependências no Render
echo "🔧 Instalando dependências do backend..."
cd backend
npm install --production
echo "✅ Dependências instaladas com sucesso!"
echo "🚀 Iniciando aplicação..."