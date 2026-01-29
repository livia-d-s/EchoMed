/*import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from '../types';

// Initialize the Gemini API client directly with the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeConsultation = async (audioBase64: string, mimeType: string, textPreview: string): Promise<AnalysisResult> => {
  const modelId = 'gemini-2.5-flash';

  const systemInstruction = `
    Você é um assistente especialista médico. Sua tarefa é dupla:
    1. Transcrever e formatar o áudio da consulta com precisão, IDENTIFICANDO AUTOMATICAMENTE OS FALANTES.
       - Use as tags **[Médico]:** e **[Paciente]:**.
       - O Médico geralmente faz perguntas, conduz a anamnese e usa termos mais técnicos.
       - O Paciente responde e descreve sintomas.
       - Corrija erros de transcrição fonética baseando-se no contexto médico.
    
    2. Gerar um diagnóstico clínico estruturado com base nessa conversa.
    
    Responda estritamente no formato JSON solicitado. Português do Brasil (PT-BR).
  `;

  // Schema for the response
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      formattedTranscript: {
        type: Type.STRING,
        description: "A transcrição completa do áudio, com falantes identificados ([Médico] e [Paciente]) e pontuação corrigida."
      },
      diagnosisResult: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING, description: "O diagnóstico principal provável" },
          confidence: { type: Type.STRING, description: "Nível de confiança: 'Alta', 'Média' ou 'Baixa'" },
          possibleDiseases: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Lista de diagnósticos diferenciais"
          },
          exams: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Exames sugeridos"
          },
          medications: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Medicamentos/tratamentos sugeridos"
          },
          rationale: { type: Type.STRING, description: "Justificativa clínica breve" }
        },
        required: ["diagnosis", "possibleDiseases", "exams", "medications", "rationale"]
      }
    },
    required: ["formattedTranscript", "diagnosisResult"]
  };

  try {
    const parts: any[] = [];
    
    // Add audio part if available
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      });
      parts.push({
        text: "Analise este áudio da consulta médica. Gere a transcrição com falantes e o diagnóstico."
      });
    } else {
      // Fallback for text only (less accurate for speaker ID but prevents crash)
      parts.push({
        text: `Analise esta transcrição bruta de consulta: "${textPreview}". Tente inferir os falantes (Médico/Paciente) pelo contexto e gere o diagnóstico.`
      });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    if (response.text) {
      const json = JSON.parse(response.text);
      return {
        formattedTranscript: json.formattedTranscript,
        diagnosis: json.diagnosisResult
      };
    } else {
      throw new Error("Sem resposta válida da IA.");
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};*/