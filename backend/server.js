const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize Firebase Admin SDK (for verifying user ID tokens)
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT env var missing — backend will reject all requests");
} else {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", err.message);
  }
}

// Middleware: verify Firebase ID Token from Authorization header
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting: max 10 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configurações do Servidor
const allowedOrigins = [
  'https://echomed.com.br',
  'https://www.echomed.com.br',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('-livia-d-s-projects.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json({ limit: '50mb' }));

// Inicializa a Inteligência Artificial do Google
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoint para análise nutricional (EchoMed)
const TONE_INSTRUCTIONS = {
  humanizado: `Use linguagem acolhedora, empática e próxima. Valide os sentimentos do paciente
e aborde as questões com sensibilidade. Evite termos excessivamente técnicos.
Priorize conexão e compreensão do contexto emocional.`,
  sistemico: `Adote uma abordagem integrativa e sistêmica. Conecte alimentação com sono, estresse,
rotina, emoções, atividade física e contexto social. Trabalhe com hipóteses de causas
subjacentes interconectadas (eixo intestino-cérebro, inflamação, microbiota, etc.).
Use linguagem profissional com base científica.`,
  direto: `Use linguagem objetiva, clara e pragmática. Foque no que é acionável. Evite rodeios
e elaborações emocionais. Vá direto à conduta e às recomendações práticas.`,
};

app.post('/api/analyze-medical', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { transcript, tone } = req.body;
    const selectedTone = tone && TONE_INSTRUCTIONS[tone] ? tone : 'humanizado';
    const toneInstruction = TONE_INSTRUCTIONS[selectedTone];

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ error: "Transcrição vazia" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured in .env file");
    }

    console.log(`🤖 Calling Google Gemini API (tone: ${selectedTone})...`);

    const systemPrompt = `
Você é uma nutricionista clínica experiente.
Seu papel é analisar a transcrição da consulta considerando que o paciente é um ser biopsicossocial,
ou seja, os sinais e queixas podem estar relacionados não apenas à alimentação,
mas também ao sono, estresse, emoções, rotina de trabalho, nível de atividade física,
relacionamentos, saúde mental e contexto de vida.

Tom da resposta: ${toneInstruction}

Evite julgamentos, rótulos ou conclusões absolutas.
Trabalhe com hipóteses nutricionais e possíveis causas associadas.

Analise a transcrição e retorne APENAS um objeto JSON válido,
sem markdown, sem explicações externas, seguindo exatamente esta estrutura:

{
  "nutritionalAssessment": "síntese concisa (MÁX 3-4 frases) da avaliação nutricional principal",
  "clinicalRationale": "justificativa detalhada considerando alimentação, comportamento, rotina, emoções, sono, estresse e treino",
  "possibleAssociatedConditions": ["condição ou desequilíbrio possível 1", "condição ou desequilíbrio possível 2"],
  "recommendedExams": ["exame laboratorial ou avaliação complementar 1", "exame 2"],
  "nutritionalConduct": "orientações nutricionais iniciais e conduta recomendada",
  "patientHighlights": ["frase curta relevante 1", "frase curta relevante 2"],
  "extractedTraining": [{"type": "Musculação", "frequency": "4x/semana"}],
  "suggestedNextQuestions": ["sugestão 1", "sugestão 2", "sugestão 3"]
}

Regras para o campo nutritionalAssessment:
- MÁXIMO 3-4 frases, síntese concisa
- Escrito em terceira pessoa sobre a paciente (ex: "A paciente apresenta..." e não "Você apresenta...")

Regras para o campo patientHighlights:
- Extraia pontos-chave mencionados na conversa
- Escreva sempre em TERCEIRA PESSOA sobre a paciente (ex: "Tem filhos, rotina corrida" — NUNCA "Tenho filhos")
- Exemplos válidos: "Não gosta de carne vermelha", "Dorme 5h por noite", "Intolerante à lactose", "Come por ansiedade"
- NÃO inclua informações sobre treino/atividade física aqui (use o campo extractedTraining)
- Máximo 8 palavras por item
- Extraia apenas o que foi dito, não invente

Regras para o campo extractedTraining:
- Extraia qualquer menção a atividade física / treino estruturado do paciente
- Formato: array de objetos { "type": "nome da atividade", "frequency": "frequência" }
- Exemplos: [{"type": "Musculação", "frequency": "4x/semana"}], [{"type": "Corrida", "frequency": "3x/semana"}, {"type": "Yoga", "frequency": "1x/semana"}]
- Se paciente disser que NÃO treina, retorne: [{"type": "Sedentária", "frequency": "não treina"}]
- Se não mencionar nada sobre treino, retorne array vazio []

Regras para o campo suggestedNextQuestions:
- Gere NO MÁXIMO 3 sugestões ESTRATÉGICAS e ACIONÁVEIS para a nutri usar na próxima consulta
- IMPORTANTE: escreva AS SUGESTÕES DIRIGIDAS À NUTRI, falando SOBRE a paciente em terceira pessoa
  * CORRETO: "Investigar o que ELA considera 'vitamina' — entender os ingredientes pode revelar oportunidades de aumentar proteínas"
  * ERRADO: "Vamos conversar sobre o que VOCÊ considera vitamina"
- Cada sugestão combina uma recomendação/pergunta COM justificativa clínica breve (1-2 linhas)
- NÃO repita conteúdo do clinicalRationale ou nutritionalConduct
- Exemplos do estilo esperado:
  * "Investigar se ela gosta de beterraba — rica em ferro, compensaria a baixa ingestão de carne vermelha e pode aliviar o cansaço relatado"
  * "Perguntar sobre qualidade do sono dela após o ajuste do jantar — alimentação noturna pesada pode estar impactando a recuperação"
  * "Explorar com ela estratégias de meal prep — a rotina corrida dificulta refeições saudáveis, e pequenos preparos antecipados podem facilitar a adesão"
- Se a transcrição for muito curta, retorne array vazio []

Se alguma informação estiver ausente na transcrição,
mencione a necessidade de investigação adicional dentro do campo apropriado,
sem inventar dados.
`;

    const prompt = `${systemPrompt}\n\nTranscrição da consulta:\n${transcript}`;

    // Use Google AI Studio API - Gemini 2.0 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(JSON.stringify(errorData));
    }

    const result = await response.json();
    console.log("API Response structure:", JSON.stringify(result, null, 2));

    // Handle different response formats
    let text;
    if (result.candidates && result.candidates.length > 0 && result.candidates[0]) {
      const content = result.candidates[0].content;
      if (content && content.parts && content.parts.length > 0) {
        text = content.parts[0].text;
      } else {
        console.error("Response content:", JSON.stringify(content, null, 2));
        throw new Error("Response has no parts - model may have hit token limit. FinishReason: " + (result.candidates[0].finishReason || "UNKNOWN"));
      }
    } else if (result.text) {
      text = result.text;
    } else {
      throw new Error("Unexpected API response format: " + JSON.stringify(result));
    }

    // Parse JSON response
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const aiResponse = JSON.parse(cleanJson);

    console.log("✅ Gemini analysis completed successfully!");

    res.json(aiResponse);

  } catch (error) {
    console.error("Erro na análise nutricional:", error);
    res.status(500).json({
      error: "Erro ao processar análise",
      details: error.message
    });
  }
});

// Endpoint legado para nutrição
app.post('/api/analyze', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { audioBase64, textPreview } = req.body;

    const prompt = `
      Você é um assistente especializado em nutrição clínica.
      Recebi uma transcrição de consulta: "${textPreview}"

      Sua tarefa:
      1. Corrigir erros de português da transcrição.
      2. Gerar uma análise clínica estruturada.

      Responda APENAS com um objeto JSON seguindo exatamente este modelo:
      {
        "formattedTranscript": "Texto corrigido",
        "diagnosisResult": {
          "diagnosis": "Título do Diagnóstico",
          "aiReading": "Explicação detalhada",
          "protocols": ["Protocolo 1", "Protocolo 2"],
          "attentionPoints": ["Ponto 1"],
          "hypotheses": [
             {"category": "Metabolismo", "description": "..."}
          ]
        }
      }
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = result.text || result.response?.text() || JSON.stringify(result);
    const cleanJson = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: "Erro interno no servidor de IA" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de IA rodando em http://localhost:${PORT}`);
});