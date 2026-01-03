
import { GoogleGenAI, Type } from "@google/genai";
import { FocusPlan, Quadrant } from "../types";

export const analyzeTasks = async (rawInput: string): Promise<FocusPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Analyze the following list of tasks or "brain dump" and organize them into the Eisenhower Matrix.
  Evaluate each task based on Urgency and Importance.
  
  Input:
  ${rawInput}
  
  Instructions:
  1. Extract individual tasks from the messy input.
  2. Assign each to one of the 4 quadrants: DO_FIRST (Urgent/Important), SCHEDULE (Important/Not Urgent), DELEGATE (Urgent/Not Important), ELIMINATE (Neither).
  3. Provide a brief reasoning for the placement.
  4. Create a short executive summary of the workload.
  5. Identify the single most critical task.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  quadrant: { 
                    type: Type.STRING,
                    description: "One of: DO_FIRST, SCHEDULE, DELEGATE, ELIMINATE"
                  },
                  urgencyScore: { type: Type.NUMBER },
                  importanceScore: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING }
                },
                required: ["title", "quadrant", "urgencyScore", "importanceScore", "reasoning", "estimatedTime"]
              }
            },
            executiveSummary: { type: Type.STRING },
            topPriority: { type: Type.STRING }
          },
          required: ["tasks", "executiveSummary", "topPriority"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText) as FocusPlan;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
};
