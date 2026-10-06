/**
 * Groq API Client
 * Ultra-fast LPU inference client with OpenAI-compatible API specifications.
 * Supports Llama 3.3 70B Versatile, JSON response mode, and function tool calling.
 */

export interface GroqChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

export interface GroqToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GroqChatCompletionOptions {
  messages: GroqChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: GroqToolDefinition[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  response_format?: { type: "json_object" | "text" };
  timeoutMs?: number;
}

export interface GroqChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqClient {
  private readonly baseUrl = "https://api.groq.com/openai/v1/chat/completions";
  public readonly defaultModel: string;

  constructor(defaultModel?: string) {
    this.defaultModel = defaultModel || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  /**
   * Checks whether the Groq API key is populated and valid.
   */
  public isConfigured(): boolean {
    const key = process.env.GROQ_API_KEY;
    return Boolean(key && key.trim() && !key.includes("your-groq"));
  }

  /**
   * Retrieves active API key.
   */
  public getApiKey(): string {
    return process.env.GROQ_API_KEY || "";
  }

  /**
   * Dispatches a chat completion request to the Groq LPU endpoint.
   */
  public async createChatCompletion(
    options: GroqChatCompletionOptions
  ): Promise<GroqChatCompletionResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured in environment variables.");
    }

    const model = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.max_tokens ?? 2048,
          ...(options.tools && options.tools.length > 0 ? { tools: options.tools, tool_choice: options.tool_choice || "auto" } : {}),
          ...(options.response_format ? { response_format: options.response_format } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Groq API request failed (${response.status}): ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      return data;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Groq API request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const groqClient = new GroqClient();
