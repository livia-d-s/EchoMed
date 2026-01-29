import { GoogleGenAI } from "@google/genai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioBase64, mimeType, textPreview } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
Você é um assistente nutricional.
Retorne SEMPRE JSON com:
{
  formattedTranscript: string,
  diagnosisResult: {
    avaliacaoGeral: string,
    protocolosSugeridos: string[],
    pontosDeAtencao: string[],
    hipotesesNutricionais: string[]
  }
}
`;

    const parts: any[] = [];

    if (audioBase64) {
      parts.push({
        inlineData: { mimeType, data: audioBase64 }
      });
      parts.push({ text: "Analise o áudio da consulta nutricional." });
    } else {
      parts.push({ text: textPreview });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text);

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500 }
    );
  }
}
