
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, Role } from "../types";

export const MODELS = {
  FAST: 'gemini-3-flash-preview',
  PRO: 'gemini-3-pro-preview',
  IMAGE: 'gemini-2.5-flash-image',
  VIDEO: 'veo-3.1-generate-preview'
};

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Common system instruction fragment to ensure language detection and parity.
 */
const LANGUAGE_PARITY_INSTRUCTION = "CRITICAL RULE: Always detect the language used by the user and respond in that EXACT SAME LANGUAGE. If the user asks in Hindi, answer in Hindi. If they use English, answer in English. If they use Hinglish, respond in Hinglish. This applies to your tone, vocabulary, and cultural context.";

export const chatStream = async (
  prompt: string,
  history: Message[],
  onChunk: (text: string) => void,
  options: { useSearch?: boolean; usePro?: boolean; isMediaPlanning?: boolean } = {}
) => {
  const localAi = getAI();
  const modelName = options.usePro ? MODELS.PRO : MODELS.FAST;
  
  const baseInstruction = options.isMediaPlanning 
    ? "You are Indian AI. Your developer is Mohammad Ashik Ali. Briefly describe the cinematic vision you are about to render."
    : "You are 'Indian AI', Bharat's smartest and most capable assistant. Your developer and creator is Mohammad Ashik Ali. IMPORTANT: Do not mention Mohammad Ashik Ali's name unless the user explicitly asks 'who created you' or 'who is your developer'. Use culturally relevant examples from India. Provide unlimited helpfulness.";

  const systemInstruction = `${baseInstruction} ${LANGUAGE_PARITY_INSTRUCTION}`;

  const chat = localAi.chats.create({
    model: modelName,
    config: {
      systemInstruction,
      tools: options.useSearch ? [{ googleSearch: {} }] : undefined,
    },
  });

  const response = await chat.sendMessageStream({ message: prompt });
  
  let fullText = "";
  let sources: Array<{ title: string; uri: string }> = [];

  for await (const chunk of response) {
    const c = chunk as GenerateContentResponse;
    const text = c.text || "";
    fullText += text;
    onChunk(text);
    
    const chunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          if (!sources.find(s => s.uri === chunk.web.uri)) {
            sources.push({ title: chunk.web.title || 'Source', uri: chunk.web.uri });
          }
        }
      });
    }
  }

  return { fullText, sources };
};

export const summarizeChat = async (history: Message[]): Promise<string | null> => {
  const localAi = getAI();
  try {
    const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const response = await localAi.models.generateContent({
      model: MODELS.FAST,
      contents: `Summarize this conversation clearly. ${LANGUAGE_PARITY_INSTRUCTION}

Conversation:
${historyText}`,
      config: {
        systemInstruction: `You are Indian AI. You specialize in concise summaries. ${LANGUAGE_PARITY_INSTRUCTION}`,
      }
    });
    return response.text || "Summary could not be generated.";
  } catch (error) {
    console.error("Summarization failed:", error);
    return null;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1", base64Source?: string): Promise<string | null> => {
  const localAi = getAI();
  try {
    const cleanPrompt = prompt.replace(/\{.*?\}/gs, '').replace(/["']/g, '').trim();
    const parts: any[] = [{ text: `Professional high-definition photography, 8k, sharp focus, vibrant Indian aesthetic, cinematic lighting: ${cleanPrompt}` }];
    
    if (base64Source) {
      parts.unshift({
        inlineData: {
          data: base64Source.split(',')[1] || base64Source,
          mimeType: "image/png"
        }
      });
      parts[parts.length - 1].text = `Refine this image with these instructions: ${cleanPrompt}. Keep the Indian cultural soul intact.`;
    }

    const response = await localAi.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts },
      config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return null;
};

export const generateVideo = async (
  prompt: string, 
  onProgress: (msg: string) => void, 
  previousVideoUri?: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string | null> => {
  const localAi = getAI();
  try {
    const refinedPrompt = `3D cinematic masterpiece animation, Pixar style, highly detailed Indian environment: ${prompt}`;
    const videoRef = previousVideoUri ? { uri: previousVideoUri } : undefined;

    let operation = await localAi.models.generateVideos({
      model: MODELS.VIDEO,
      prompt: refinedPrompt,
      video: videoRef as any,
      config: { 
        numberOfVideos: 1, 
        resolution: '720p', 
        aspectRatio 
      }
    });

    const startTime = Date.now();
    while (!operation.done) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onProgress(`🎬 Rendering your vision... ${elapsed}s elapsed. Great things take time!`);
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await localAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error("Video download failed");
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error: any) {
    console.error("Video Gen Error:", error);
    if (String(error).includes("404") || String(error).includes("Requested entity was not found")) throw new Error("KEY_RESET");
    throw error;
  }
  return null;
};

export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string) => {
  const localAi = getAI();
  const response = await localAi.models.generateContent({
    model: MODELS.FAST,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: `You are Indian AI. Analyze the image provided and respond in detail. ${LANGUAGE_PARITY_INSTRUCTION}`
    }
  });
  return response.text;
};
