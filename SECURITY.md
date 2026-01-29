# 🔒 Guia de Segurança - EchoMed

## Arquitetura Segura Implementada

Este projeto foi configurado para **proteger sua API Key do Gemini** usando uma arquitetura de backend seguro.

## 🏗️ Estrutura

```
Frontend (React)          Backend (Express)         Google Gemini API
    |                            |                          |
    |--[HTTP Request]----------->|                          |
    |   (sem API key)            |--[Com API Key]---------->|
    |                            |<-------[Response]--------|
    |<---[Response]--------------|
```

### ✅ O que está SEGURO:
- ✅ API Key do Gemini está APENAS no backend
- ✅ Usuários nunca veem a API key
- ✅ Código do frontend não expõe segredos
- ✅ Backend valida todas as requisições

### ❌ O que NÃO fazer:
- ❌ NUNCA coloque `VITE_GEMINI_API_KEY` no `.env` do frontend
- ❌ NUNCA commite o arquivo `backend/.env` no Git
- ❌ NUNCA exponha a API Key em código JavaScript

## 🚀 Como Executar

### Opção 1: Executar Frontend e Backend Separadamente

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
npm run dev
```

### Opção 2: Executar Tudo de Uma Vez

```bash
npm start
```

## 📝 Variáveis de Ambiente

### Frontend `.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# URL do seu backend
VITE_BACKEND_URL=http://localhost:3001
```

### Backend `backend/.env`:
```env
# Esta é a chave SECRETA - NUNCA exponha no frontend!
GEMINI_API_KEY=sua_chave_aqui
```

## 🌐 Deploy em Produção

### Frontend (Vercel/Netlify):
1. Configure `VITE_BACKEND_URL` para apontar para seu backend em produção
2. Exemplo: `VITE_BACKEND_URL=https://seu-backend.herokuapp.com`

### Backend (Heroku/Railway/Render):
1. Configure `GEMINI_API_KEY` nas variáveis de ambiente do servidor
2. Configure CORS para aceitar apenas seu domínio frontend
3. Adicione rate limiting para evitar abuso

### Exemplo de CORS restrito no backend:
```javascript
app.use(cors({
  origin: 'https://seu-frontend.vercel.app'
}));
```

## 🔐 Checklist de Segurança

- [ ] `backend/.env` está no `.gitignore`
- [ ] API Key do Gemini está APENAS no backend
- [ ] Frontend usa `VITE_BACKEND_URL` para chamar o backend
- [ ] CORS configurado corretamente em produção
- [ ] Rate limiting implementado no backend (recomendado)

## 📚 Mais Informações

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
