# 🚀 EchoMed - Guia de Inicialização

## ⚡ Início Rápido

### Opção 1: Tudo de uma vez (Recomendado)
```bash
npm start
```

### Opção 2: Separadamente (Para debug)
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
npm run dev
```

## 🌐 Acesso

Depois de iniciar, acesse no navegador:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## ✅ Checklist de Problemas Comuns

### ❌ "Cannot GET /"
**Causa**: Import map do CDN estava conflitando com Vite bundler
**Solução**: ✅ Já corrigido! Removi o import map do `index.html`

### ❌ Tela branca/blank
**Causa**: Firebase não inicializando corretamente
**Solução**: ✅ Já corrigido!
- Adicionado `vite-env.d.ts` com declarações globais
- Corrigido `firebaseConfig.ts` com fallback seguro
- Corrigido `AuthContext.tsx` para React proper types

### ❌ Firebase auth/invalid-api-key
**Causa**: `import.meta.env` retornando `undefined`
**Solução**: ✅ Já corrigido! Agora usa fallback com `(import.meta as any).env`

### ❌ Content Security Policy violations
**Causa**: Extensão do navegador (provavelmente DevTools ou adblock)
**Solução**: Esses avisos são normais e não afetam a aplicação

### ❌ Backend: GoogleGenerativeAI is not a constructor
**Causa**: API mudou na v1.37.0
**Solução**: ✅ Já corrigido! Agora usa `GoogleGenAI` com `genAI.models.generateContent()`

## 📋 Estrutura de Arquivos Corrigida

```
EchoMed/
├── index.html              ✅ SEM import map, carrega index.tsx
├── index.css               ✅ Criado com estilos globais
├── index.tsx               ✅ Entry point React
├── .env                    ✅ Firebase + Backend URL
├── vite.config.ts          ✅ Configurado corretamente
│
├── src/
│   ├── vite-env.d.ts       ✅ NOVO! Type declarations
│   ├── App.tsx             ✅ Firebase init com fallback
│   ├── firebaseConfig.ts   ✅ Safe env var access
│   └── context/
│       └── AuthContext.tsx ✅ React types corrigidos
│
└── backend/
    ├── .env                ✅ GEMINI_API_KEY seguro
    └── server.js           ✅ GoogleGenAI API v1.37.0
```

## 🔧 Troubleshooting

### Se o frontend não carregar:

1. **Limpe o cache do navegador**:
   - Chrome: Ctrl+Shift+Delete
   - Ou abra em aba anônima

2. **Verifique se os servidores estão rodando**:
   ```bash
   netstat -ano | grep ":3000\|:3001"
   ```
   Deve mostrar ambas as portas em LISTENING

3. **Verifique o console do navegador**:
   - Abra DevTools (F12)
   - Procure por erros em vermelho
   - Erros de CSP (Content Security Policy) são normais de extensões

4. **Reinicie tudo**:
   ```bash
   # Mate todos os processos Node
   taskkill /IM node.exe /F

   # Inicie novamente
   npm start
   ```

### Se o backend falhar:

1. **Verifique a API key do Gemini**:
   ```bash
   cat backend/.env
   # Deve ter: GEMINI_API_KEY=AIzaSy...
   ```

2. **Teste o backend diretamente**:
   ```bash
   curl -X POST http://localhost:3001/api/analyze-medical \
     -H "Content-Type: application/json" \
     -d '{"transcript":"Paciente com dor de cabeça"}'
   ```

### Se Firebase não autenticar:

1. **Habilite Anonymous Auth no Firebase Console**:
   https://console.firebase.google.com/project/echo-med-database/authentication/providers

2. **Verifique as variáveis de ambiente**:
   ```bash
   cat .env
   # Deve ter VITE_FIREBASE_API_KEY e outros
   ```

## 📞 Logs Úteis

### Logs de sucesso que você deve ver:

**Console do navegador**:
```
🔥 Firebase Config Loaded: { hasApiKey: true, apiKeyLength: 39, projectId: 'echo-med-database' }
Firebase config loaded: { hasApiKey: true, projectId: 'echo-med-database' }
Attempting anonymous auth...
Anonymous auth successful!
User authenticated: [uid]
```

**Terminal do backend**:
```
🚀 Servidor de IA rodando em http://localhost:3001
```

**Terminal do frontend**:
```
VITE v6.4.1  ready in 257 ms
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.0.2:3000/
```

## 🎉 Tudo Funcionando?

Se você vê:
- ✅ Interface do EchoMed carregada
- ✅ Sem erros de Firebase no console
- ✅ Backend rodando na porta 3001
- ✅ Frontend rodando na porta 3000

**Parabéns! Está tudo pronto para usar!** 🎊

## 🔐 Segurança

- ✅ Gemini API key está APENAS no backend
- ✅ Firebase config é público (normal)
- ✅ Frontend chama backend, não o Gemini diretamente
- ✅ `.env` files no `.gitignore`

## 📚 Próximos Passos

1. Teste gravando uma consulta médica
2. Veja a análise de IA sendo gerada
3. Explore o histórico de consultas
4. Personalize o perfil do médico

---

**Desenvolvido com ❤️ usando React + Firebase + Gemini AI**
