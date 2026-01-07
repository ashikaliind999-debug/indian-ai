
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, Role } from "../types";

export const MODELS = {
  FAST: 'gemini-3-flash-preview',
  PRO: 'gemini-3-pro-preview',
  IMAGE: 'gemini-2.5-flash-image',
  VIDEO: 'veo-3.1-generate-preview' // Upgraded to Pro version for editing/extension support
};

export const chatStream = async (
  prompt: string,
  history: Message[],
  onChunk: (text: string) => void,
  options: { useSearch?: boolean; usePro?: boolean; isMediaPlanning?: boolean } = {}
) => {
  const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = options.usePro ? MODELS.PRO : MODELS.FAST;
  
  const systemInstruction = options.isMediaPlanning 
    ? "You are Indian AI. The user wants to create an image or a 15-second 3D video. Briefly describe the cinematic scene you are about to 'take' or 'render' in a friendly way (Hindi/English). Do not use JSON. Just describe the vision."
    : "You are 'Indian AI', Bharat's smartest and most capable assistant. Respond in a friendly Hindi/English mix. NEVER output JSON tool blocks or internal thought blocks. If a user asks for media, tell them you are starting the process.";

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

export const generateImage = async (prompt: string, base64Source?: string): Promise<string | null> => {
  const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const cleanPrompt = prompt.replace(/\{.*?\}/gs, '').replace(/["']/g, '').trim();
    const parts: any[] = [{ text: `Professional cinematic photography, 8k, sharp details, vibrant Indian aesthetic: ${cleanPrompt}` }];
    
    if (base64Source) {
      parts.unshift({
        inlineData: {
          data: base64Source.split(',')[1] || base64Source,
          mimeType: "image/png"
        }
      });
      parts[parts.length - 1].text = `Refine and correct this image: ${cleanPrompt}. Fix any problems or artifacts.`;
    }

    const response = await localAi.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
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
  const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanPrompt = prompt.replace(/\{.*?\}/gs, '').replace(/["']/g, '').trim();
  
  try {
    const refinedPrompt = `3D cinematic animation, Disney Pixar style, professional lighting: ${cleanPrompt}`;
    
    // If we have a previous video, we use the video-to-video editing/extension path
    const videoRef = previousVideoUri ? { uri: previousVideoUri } : undefined;

    let operation = await localAi.models.generateVideos({
      model: MODELS.VIDEO,
      prompt: refinedPrompt,
      video: videoRef as any, // Cast due to SDK type variations
      config: { 
        numberOfVideos: 1, 
        resolution: '720p', 
        aspectRatio 
      }
    });

    const startTime = Date.now();
    while (!operation.done) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onProgress(`🎬 Rendering Bharat Studio Edit: ${elapsed}s elapsed... modifying cinematic sequence.`);
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
    if (String(error).includes("404") || String(error).includes("Requested entity was not found")) throw new Error("KEY_RESET");
    throw error;
  }
  return null;
};

export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string) => {
  const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await localAi.models.generateContent({
    model: MODELS.FAST,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text;
};
