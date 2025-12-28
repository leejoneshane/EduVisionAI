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
    - User Mode: ${state.mode}
    - Student Age/Grade: ${state.basicInfo.age}
    - Subject: ${state.basicInfo.subject}
    - Topic: ${state.basicInfo.topic}
    - Learning Goal: ${state.goals.learningGoal}
    - Timing: ${state.goals.timing}

    Please refer to the "Template Recommendations" in your system knowledge.
    
    Output Format:
    Return a concise suggestion IN TRADITIONAL CHINESE (繁體中文).
    Start with "建議組合：" followed by the modules and a 1-sentence reason. 
    Example: "建議組合：C 客製化圖卡 ＋ B 繪本場景。因為語文學習適合透過圖像記憶與情境故事結合。"
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

  // Stronger instruction logic for language
  let visualLanguageInstruction = "";
  if (state.visualLanguage === 'English') {
     visualLanguageInstruction = "Visual Content Language: English. In the JSON prompts, specific keywords must be English.";
  } else {
     visualLanguageInstruction = `
       Visual Content Language: Traditional Chinese. 
       CRITICAL PROMPT RULE: When writing the prompts in the JSON block, you MUST include the following explicit instruction in every prompt:
       "Unless specified otherwise, all text in the image must be in Traditional Chinese."
       
       This ensures that not just the title, but all labels, diagrams, and secondary text are rendered in Traditional Chinese characters.
     `;
  }

  // Constructing the user input flow as if the conversation happened
  const userRequest = `
    I have completed the requirements collection. Please generate the educational visualization design.

    1. Mode: ${state.mode === 'TEACHER' ? '👩‍🏫 教師模式' : '👨‍🎓 學生模式'}
    2. Target: ${state.basicInfo.age}, ${state.basicInfo.subject}, ${state.basicInfo.topic}
    3. Goal: ${state.goals.learningGoal}, Timing: ${state.goals.timing}
    4. Selected Modules: ${state.selectedModules.join(', ')}
    5. Student Traits: ${state.studentTraits.interests} (Differentiation: ${state.studentTraits.differentiation ? 'Yes' : 'No'})
    6. ${visualLanguageInstruction}

    Please output the full design following the "Teaching Output Format" structure.
    
    IMPORTANT: 
    1. The main content MUST be in TRADITIONAL CHINESE (繁體中文).
    2. The output MUST be valid HTML (not Markdown).
    3. You MUST use Google Search to verify facts.
    
    Sections to generate (HTML):
    - Title Section (h1, tags)
    - Teaching Activity Design (h2, p, ul)
    - Visual/Image Design Description (h2, p, highlight-box)
    
    CRITICAL INSTRUCTION FOR PROMPTS (JSON):
    At the very end of your HTML response, you MUST append a script tag containing the prompts in JSON format.
    
    Format:
    <script id="prompts" type="application/json">
    [
      {
        "prompt": "Detailed English prompt...",
        "aspect_ratio": "4:3" 
      },
      ...
    ]
    </script>
    
    [PROMPT WRITING RULES]:
    1. **BASE LANGUAGE**: Write the 'prompt' in English to ensure high-quality artistic generation.
    2. **TEXT RENDERING**: 
       - If "Visual Content Language" is **Traditional Chinese**: You MUST append "Unless specified otherwise, all text in the image must be in Traditional Chinese." to the prompt.
       - If "Visual Content Language" is **English**: Use English text labels.
    3. **ASPECT RATIO** selection:
       - **Module F (Teaching Slides)**: MUST be "16:9".
       - **Module C (Flashcards)**: MUST be "16:9".
       - **Module A, B, D, E** (Printable A4/B4): MUST be "4:3".
    4. **MULTI-IMAGE GENERATION**:
       - If **Module D** is selected: You MUST provide **2 separate prompt objects**.
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
  // Regex to find the JSON inside the script tag
  // Matches <script id="prompts" type="application/json"> ...content... </script>
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
      console.warn("Failed to parse JSON prompt block from HTML", e);
    }
  }

  // Fallback: try to find markdown block just in case AI failed to follow HTML instruction strictly
  const jsonBlockRegex = /```json\n([\s\S]*?)```/g;
  const mdMatch = jsonBlockRegex.exec(htmlContent);
  if (mdMatch && mdMatch[1]) {
     try {
        const json = JSON.parse(mdMatch[1]);
        if (Array.isArray(json)) {
            return json.map((m: any) => ({
              prompt: m.prompt || "",
              aspectRatio: m.aspect_ratio || m.aspectRatio || "4:3"
            }));
        }
     } catch(e) {}
  }

  return [];
};

export const generateImage = async (prompt: string, aspectRatioInput: string = "4:3"): Promise<string> => {
  const ai = getClient();
  
  // Normalize aspect ratio
  let aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "4:3";
  if (aspectRatioInput === "1:1") aspectRatio = "1:1";
  if (aspectRatioInput === "16:9") aspectRatio = "16:9";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt },
        ],
      },
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
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};