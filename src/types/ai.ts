// ==============================================================================
// AI Travel Copilot Domain Types & Tool Schemas
// ==============================================================================

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ToolCallPayload {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  thoughtSignature?: string;
  rawPart?: Record<string, unknown>;
}

export interface ToolResultPayload {
  toolCallId: string;
  name: string;
  result: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolCalls?: ToolCallPayload[];
  toolResults?: ToolResultPayload[];
  rawModelParts?: any[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

export interface ToolExecutionEvent {
  toolName: string;
  arguments: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  status: "success" | "error";
  errorMessage?: string;
}

export interface CopilotContext {
  userId: string;
  tripId?: string;
  isAuthorized: boolean;
}

export interface CopilotChatRequest {
  message: string;
  tripId?: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  provider?: "gemini" | "groq" | string;
}

export interface CopilotChatResponse {
  reply: string;
  toolEvents: ToolExecutionEvent[];
  suggestedActions?: string[];
  conversationId: string;
  provider: string;
}

export interface AIModelProvider {
  readonly name: string;
  generateResponse(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    context?: CopilotContext
  ): Promise<{
    content: string;
    toolCalls?: ToolCallPayload[];
    rawModelParts?: any[];
  }>;
}
