import { GoogleGenerativeAI } from "@google/generative-ai";

export const MODELS = {
  FAST: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
};

const getAI = () => {
  // Vite aur Vercel ke liye sahi tarika
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("API Key missing! Check Vercel Environment Variables.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const chatStream = async (
  prompt: string,
  history: any[],
  onChunk: (text: string) => void,
  options: { usePro?: boolean } = {}
) => {
  const genAI = getAI();
  const modelName = options.usePro ? MODELS.PRO : MODELS.FAST;
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: "You are 'Indian AI', created by Mohammad Ashik Ali. Answer in the same language the user uses (Hindi/English/Hinglish)."
  });

  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessageStream(prompt);
  
  let fullText = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullText += text;
    onChunk(text);
  }
  return { fullText, sources: [] };
};

// Dummy functions taaki errors na aayein
export const summarizeChat = async () => null;
export const generateImage = async () => null;
export const generateVideo = async () => null;
export const analyzeImage = async () => null;
