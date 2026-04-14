const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();

// Configurações do Servidor
const allowedOrigins = [
  'https://echomed.com.br',
  'https://www.echomed.com.br',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.post('/api/analyze-medical', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ error: "Transcrição vazia" });
    }

    // Use Google AI Studio / Gemini API ($300 free credit!)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured in .env file");
    }

    console.log("🤖 Calling Google Gemini API for nutritional analysis...");

    const systemPrompt = `
Você é uma nutricionista clínica experiente, com abordagem humanizada e integrativa.
Seu papel é analisar a transcrição da consulta considerando que o paciente é um ser biopsicossocial,
ou seja, os sinais e queixas podem estar relacionados não apenas à alimentação,
mas também ao sono, estresse, emoções, rotina de trabalho, nível de atividade física,
relacionamentos, saúde mental e contexto de vida.

Evite julgamentos, rótulos ou conclusões absolutas.
Trabalhe com hipóteses nutricionais e possíveis causas associadas.
Utilize linguagem profissional, acolhedora e clara.

Analise a transcrição e retorne APENAS um objeto JSON válido,
sem markdown, sem explicações externas, seguindo exatamente esta estrutura:

{
  "nutritionalAssessment": "síntese da avaliação nutricional principal, em forma de hipótese",
  "clinicalRationale": "justificativa detalhada considerando alimentação, comportamento, rotina, emoções, sono, estresse e treino",
  "possibleAssociatedConditions": ["condição ou desequilíbrio possível 1", "condição ou desequilíbrio possível 2"],
  "recommendedExams": ["exame laboratorial ou avaliação complementar 1", "exame 2"],
  "nutritionalConduct": "orientações nutricionais iniciais e conduta recomendada de forma humanizada"
}

Se alguma informação estiver ausente na transcrição,
mencione a necessidade de investigação adicional dentro do campo apropriado,
sem inventar dados.
`;

    const prompt = `${systemPrompt}\n\nTranscrição da consulta:\n${transcript}`;

    // Use Google AI Studio API - Gemini 2.0 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048  // Increased for Gemini 2.5 Pro thinking mode
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
app.post('/api/analyze', async (req, res) => {
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