
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

// IMPORTANT: This is a placeholder for a secure API key handling mechanism.
// In a real application, this would be managed server-side.
const API_KEY = process.env.API_KEY;

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  
  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      console.error("API_KEY environment variable not set. GeminiService will not be available.");
    }
  }

  private handleError(error: unknown, defaultMessage: string): Promise<never> {
    console.error('Error calling Gemini API:', error);
    const message = error instanceof Error ? error.message : defaultMessage;
    return Promise.reject(new Error(message));
  }

  async suggestProcedure(description: string): Promise<string> {
    if (!this.genAI) {
      return Promise.reject("Gemini AI client is not initialized. Please check your API key.");
    }

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following dental observation, suggest a primary ADA CDT procedure code and a brief, one-sentence justification. Observation: "${description}"`,
        config: {
          systemInstruction: "You are a helpful dental coding assistant. Provide responses in JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              procedureCode: {
                type: Type.STRING,
                description: 'The suggested ADA CDT code, e.g., "D2740".',
              },
              justification: {
                type: Type.STRING,
                description: 'A brief, one-sentence justification for the code.',
              }
            },
            required: ["procedureCode", "justification"]
          },
        },
      });
      
      return response.text;
    } catch (error) {
      return this.handleError(error, 'Failed to get suggestion from AI assistant. Please try again later.');
    }
  }

  async explainProcedure(procedureCode: string, procedureText: string): Promise<string> {
    if (!this.genAI) {
      return Promise.reject("Gemini AI client is not initialized. Please check your API key.");
    }

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explain the dental procedure "${procedureCode} - ${procedureText}" to a patient in simple, easy-to-understand terms. Be concise and reassuring.`,
        config: {
          systemInstruction: "You are a friendly dental assistant explaining a procedure to a patient who has no medical background.",
        },
      });
      
      return response.text;
    } catch (error) {
       return this.handleError(error, 'Failed to get explanation from AI assistant. Please try again later.');
    }
  }
}
