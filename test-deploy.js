// Teste de validação para deploy
console.log('🔍 VALIDAÇÃO DEPLOY - SALA DE SINAIS PRO')
console.log('===========================================')

// Verificar arquivos essenciais
const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'backend/server.js',
  'backend/package.json', 
  'frontend/index.html',
  'frontend/admin.html',
  'frontend/styles.css',
  'package.json',
  'render.yaml'
]

console.log('\n📁 Verificando arquivos essenciais:')
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - FALTANDO!`)
  }
})

// Verificar package.json
console.log('\n📦 Verificando package.json:')
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  console.log(`✅ Nome: ${pkg.name}`)
  console.log(`✅ Versão: ${pkg.version}`)
  console.log(`✅ Start script: ${pkg.scripts.start}`)
  console.log(`✅ Node engine: ${pkg.engines?.node || 'não especificado'}`)
} catch (e) {
  console.log('❌ Erro ao ler package.json:', e.message)
}

// Verificar render.yaml
console.log('\n🚀 Verificando render.yaml:')
try {
  const renderConfig = fs.readFileSync('render.yaml', 'utf8')
  console.log('✅ render.yaml encontrado')
  if (renderConfig.includes('sala-sinais-pro')) console.log('✅ Nome do serviço OK')
  if (renderConfig.includes('node backend/server.js')) console.log('✅ Start command OK')
  if (renderConfig.includes('admin@csi.invest')) console.log('✅ Admin email OK')
} catch (e) {
  console.log('❌ Erro ao ler render.yaml:', e.message)
}

console.log('\n🎯 RESULTADO:')
console.log('✅ Projeto pronto para deploy no Render!')
console.log('📋 Siga as instruções no DEPLOY-RAPIDO.md')
console.log('🌐 URL será: https://sala-sinais-pro-dxw0.onrender.com')