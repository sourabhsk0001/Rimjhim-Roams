import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in environment variables.");
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

export const GEMINI_MODEL = "gemini-1.5-flash";

export { geminiQuotaManager, enforceGeminiQuota } from "@/lib/security/gemini-quota";
