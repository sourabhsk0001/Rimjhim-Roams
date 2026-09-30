import {
  ChatMessage,
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotContext,
  ToolExecutionEvent,
} from "@/types/ai";
import { COPILOT_TOOL_DEFINITIONS, toolRegistry } from "@/lib/ai/tools/registry";
import { getAIModelProvider } from "@/lib/ai/provider";
import { getTripById } from "@/lib/services/trip-service";

export class CopilotService {
  /**
   * Process a conversational user prompt through the AI Copilot.
   * Dispatches tool calls deterministically to backend domain services.
   * Guarantees zero floating-point LLM calculations and strict user authorization isolation.
   */
  async processMessage(
    request: CopilotChatRequest,
    userId: string
  ): Promise<CopilotChatResponse> {
    const trimmedMessage = (request.message || "").trim();
    if (!trimmedMessage) {
      throw new Error("Message cannot be empty.");
    }

    // 1. Authorize and isolate trip context if a tripId is provided
    let isAuthorized = true;
    if (request.tripId) {
      const { trip, isAuthorized: userOwnsTrip } = await getTripById(request.tripId, userId);
      if (!trip || !userOwnsTrip) {
        throw new Error("Unauthorized: Access denied to the requested trip.");
      }
      isAuthorized = userOwnsTrip;
    }

    const context: CopilotContext = {
      userId,
      tripId: request.tripId,
      isAuthorized,
    };

    // 2. Hydrate message history
    const messages: ChatMessage[] = [];

    if (request.history && request.history.length > 0) {
      for (const h of request.history) {
        messages.push({
          id: `hist_${Math.random().toString(36).substring(2, 8)}`,
          role: h.role,
          content: h.content,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Add current user prompt
    messages.push({
      id: `usr_${Date.now()}`,
      role: "user",
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
    });

    const provider = getAIModelProvider();
    const toolEvents: ToolExecutionEvent[] = [];
    let finalReply = "";

    // 3. Multi-turn Tool Calling Execution Loop (Safe ceiling of 4 rounds)
    const MAX_ROUNDS = 4;
    let round = 0;

    while (round < MAX_ROUNDS) {
      round++;
      const aiResponse = await provider.generateResponse(
        messages,
        COPILOT_TOOL_DEFINITIONS,
        context
      );

      // If the provider returned content and no further tool calls, we are finished
      if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
        finalReply = aiResponse.content;
        break;
      }

      // Record assistant call in conversation history
      messages.push({
        id: `asst_${Date.now()}_${round}`,
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        toolCalls: aiResponse.toolCalls,
      });

      // Execute each tool deterministically through the ToolRegistry
      const toolResults = [];

      for (const tc of aiResponse.toolCalls) {
        const start = Date.now();
        try {
          // If the tool call omitted tripId but context has an active tripId, inject it
          const args = { ...tc.arguments };
          if (!args.tripId && context.tripId) {
            args.tripId = context.tripId;
          }

          const output = await toolRegistry.executeTool(tc.name, args, context);
          const durationMs = Date.now() - start;

          toolEvents.push({
            toolName: tc.name,
            arguments: args,
            output,
            durationMs,
            status: "success",
          });

          toolResults.push({
            toolCallId: tc.id,
            name: tc.name,
            result: output,
          });
        } catch (err: unknown) {
          const durationMs = Date.now() - start;
          const msg = err instanceof Error ? err.message : "Tool execution failed";

          toolEvents.push({
            toolName: tc.name,
            arguments: tc.arguments,
            output: { error: msg },
            durationMs,
            status: "error",
            errorMessage: msg,
          });

          toolResults.push({
            toolCallId: tc.id,
            name: tc.name,
            result: { error: msg },
          });
        }
      }

      // Add tool responses back to the conversation
      messages.push({
        id: `tool_${Date.now()}_${round}`,
        role: "tool",
        content: "",
        timestamp: new Date().toISOString(),
        toolResults,
      });
    }

    // 4. Fallback reply formatting if final reply was empty
    if (!finalReply) {
      if (toolEvents.length > 0) {
        const lastSuccess = toolEvents.filter((e) => e.status === "success").pop();
        if (lastSuccess) {
          finalReply = `I executed ${toolEvents.map((t) => `\`${t.toolName}\``).join(", ")}. ${
            typeof lastSuccess.output.explanation === "string"
              ? lastSuccess.output.explanation
              : "Calculations completed deterministically."
          }`;
        } else {
          finalReply = "The operation encountered an issue with the requested tool.";
        }
      } else {
        finalReply = "I am ready to help you plan or adjust your travel itinerary.";
      }
    }

    // 5. Generate contextual suggested actions
    const suggestedActions = this.generateSuggestedActions(trimmedMessage, toolEvents, context);

    return {
      reply: finalReply,
      toolEvents,
      suggestedActions,
      conversationId: `conv_${Date.now()}`,
      provider: provider.name,
    };
  }

  /**
   * Produce dynamic follow-up prompts based on the context and tools executed
   */
  private generateSuggestedActions(
    query: string,
    events: ToolExecutionEvent[],
    context: CopilotContext
  ): string[] {
    const suggestions: string[] = [];
    const text = query.toLowerCase();

    if (events.some((e) => e.toolName === "calculate_budget" || e.toolName === "replan_trip")) {
      suggestions.push("Show detailed day-by-day budget");
      suggestions.push("Check live weather forecast");
    } else if (events.some((e) => e.toolName === "search_restaurants")) {
      suggestions.push("Find dinner spots with outdoor seating");
      suggestions.push("Calculate route from my hotel");
    } else if (events.some((e) => e.toolName === "optimize_itinerary")) {
      suggestions.push("Check Day 1 schedule validity");
      suggestions.push("Make today's trip cheaper");
    } else if (context.tripId) {
      suggestions.push("Make today's trip cheaper");
      suggestions.push("Find a restaurant near my hotel under ₹300");
      suggestions.push("Check weather risks");
    } else {
      suggestions.push("Where can I travel for ₹20,000?");
      suggestions.push("Find beach getaways in Goa");
      suggestions.push("Search budget heritage hotels in Jaipur");
    }

    return suggestions.slice(0, 3);
  }
}

export const copilotService = new CopilotService();
