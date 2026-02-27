import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { EduState } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
};

export const suggestModules = async (state: EduState): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
    Based on the following context, suggest the best combination of educational visualization modules (A, B, C, D, E, F).
    
    Context:
    - Target: ${state.basicInfo.age}
    - Subject: ${state.basicInfo.subject}
    - Topic: ${state.basicInfo.topic}
    - Information Density: ${state.basicInfo.density}

    Output Format:
    Return a concise suggestion IN TRADITIONAL CHINESE (繁體中文).
    Start with "建議組合：" followed by the modules and a 1-sentence reason. 
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });
    return response.text || "無法產生建議，請稍後再試。";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return "AI 暫時忙碌中，請手動選擇。";
  }
};

export const generatePlan = async (state: EduState): Promise<string> => {
  const ai = getClient();

  let visualLanguageInstruction = "";
  if (state.visualLanguage === 'English') {
     visualLanguageInstruction = "Visual Content Language: English.";
  } else {
     visualLanguageInstruction = "Visual Content Language: Traditional Chinese. Instruction for Prompts: All labels and text in the image must be in Traditional Chinese.";
  }

  const userRequest = `
    Generate the educational visualization design.

    1. Information Density: ${state.basicInfo.density}
    2. Target: ${state.basicInfo.age}, ${state.basicInfo.subject}, ${state.basicInfo.topic}
    3. Selected Modules: ${state.selectedModules.join(', ')}
    4. Interests: ${state.studentTraits.interests}
    5. ${visualLanguageInstruction}

    IMPORTANT: 
    - Output MUST be valid HTML.
    - MAIN CONTENT MUST BE IN TRADITIONAL CHINESE.
    - ALL IMAGES MUST INCLUDE FULL ANSWERS AND LABELS. NO BLANKS.
    - Use Google Search for facts.
    
    Append prompts JSON in a script tag at the end.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userRequest,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });
    return response.text || "生成失敗，請重試。";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return `發生錯誤: ${(error as Error).message}`;
  }
};

export interface ExtractedPrompt {
  prompt: string;
  aspectRatio: '1:1' | '4:3' | '16:9';
}

export const extractPrompts = (htmlContent: string): ExtractedPrompt[] => {
  const scriptRegex = /<script id="prompts" type="application\/json">([\s\S]*?)<\/script>/i;
  const match = scriptRegex.exec(htmlContent);
  
  if (match && match[1]) {
    try {
      const jsonStr = match[1].trim();
      const json = JSON.parse(jsonStr);
      if (Array.isArray(json)) {
        return json.map((m: any) => ({
          prompt: m.prompt || "",
          aspectRatio: m.aspect_ratio || m.aspectRatio || "4:3"
        })).filter(p => p.prompt.length > 0);
      }
    } catch (e) {
      console.warn("Failed to parse JSON prompt block", e);
    }
  }
  return [];
};

export const generateImage = async (prompt: string, aspectRatioInput: string = "4:3"): Promise<string> => {
  const ai = getClient();
  let aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "4:3";
  if (aspectRatioInput === "1:1") aspectRatio = "1:1";
  if (aspectRatioInput === "16:9") aspectRatio = "16:9";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
