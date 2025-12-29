
import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, AssessmentResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizFromRant = async (rant: string): Promise<Quiz> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `用户吐槽内容: "${rant}"\n\n请根据以上内容，动态生成一套包含5个问题的心理测评。题目应具有治愈感且专业。`,
    config: {
      systemInstruction: "你是一个专业的心理咨询AI。你的任务是根据用户的吐槽生成一个定制化的心理测评，帮助用户更好地理解自己的情绪。返回JSON格式。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      weight: { type: Type.NUMBER }
                    },
                    required: ["id", "text", "weight"]
                  }
                }
              },
              required: ["id", "question", "options"]
            }
          }
        },
        required: ["title", "description", "questions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeQuizResult = async (rant: string, quiz: Quiz, answers: Record<number, string>): Promise<AssessmentResult> => {
  const answerDetails = quiz.questions.map(q => {
    const selectedOptionId = answers[q.id];
    const option = q.options.find(o => o.id === selectedOptionId);
    return `问题: ${q.question} - 用户选择: ${option?.text} (权重: ${option?.weight})`;
  }).join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `原始吐槽: "${rant}"\n\n测评详情:\n${answerDetails}`,
    config: {
      systemInstruction: `你是一个资深的心理专家。基于用户的吐槽和测评结果，提供深度分析。
      要求：
      1. 温暖、治愈、非评判性的话术。
      2. 分析情绪状态、应对方式、潜在需求。
      3. 提供心理学视角的见解。
      4. 给出具体可行的3-5条建议。
      5. 如果发现有自残或自杀倾向，请务必设置 crisisWarning 为 true。
      返回JSON。`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emotionalState: { type: Type.STRING },
          copingStyle: { type: Type.STRING },
          potentialNeeds: { type: Type.STRING },
          psychologicalInsight: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          crisisWarning: { type: Type.BOOLEAN }
        },
        required: ["emotionalState", "copingStyle", "potentialNeeds", "psychologicalInsight", "suggestions"]
      }
    }
  });

  return JSON.parse(response.text);
};
