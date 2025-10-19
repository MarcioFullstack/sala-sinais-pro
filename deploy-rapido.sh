#!/bin/bash

# Script de deploy rápido para Render
echo "🚀 Deploy Rápido - Sala de Sinais PRO"

# Verificar se existem mudanças
if [ -z "$(git status --porcelain)" ]; then
  echo "ℹ️  Nenhuma mudança detectada."
  exit 0
fi

# Adicionar todos os arquivos
echo "📦 Adicionando arquivos..."
git add .

# Commit com timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "💾 Fazendo commit..."
git commit -m "deploy: otimizações Render - $TIMESTAMP"

# Push para trigger deploy
echo "📤 Enviando para GitHub..."
git push origin main

echo "✅ Deploy iniciado!"
echo "🔗 Acompanhe em: https://dashboard.render.com"
echo "⏱️  Tempo estimado: 1-2 minutos"
echo "🌐 URL: https://sala-sinais-pro.onrender.com"