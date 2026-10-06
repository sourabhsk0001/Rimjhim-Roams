import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from "@google/generative-ai";
import {
  AIModelProvider,
  ChatMessage,
  CopilotContext,
  ToolCallPayload,
  ToolDefinition,
} from "@/types/ai";

/**
 * GeminiModelProvider integrates with Google Gemini API using function declarations / tool calling.
 * Strictly adheres to the zero-authoritative-math rule:
 * The model only selects tools and synthesizes explanations; it never calculates values itself.
 */
export class GeminiModelProvider implements AIModelProvider {
  public readonly name = "Google Gemini (gemini-1.5-flash)";
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = "gemini-1.5-flash") {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required for GeminiModelProvider.");
    }
    this.client = new GoogleGenerativeAI(key);
    this.modelName = modelName;
  }

  async generateResponse(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    context?: CopilotContext
  ): Promise<{
    content: string;
    toolCalls?: ToolCallPayload[];
  }> {
    // 1. Format tools into Gemini FunctionDeclaration format
    const functionDeclarations: FunctionDeclaration[] = tools.map((t) => {
      const properties: Record<string, any> = {};
      for (const [key, prop] of Object.entries(t.parameters.properties)) {
        let schemaType = SchemaType.STRING;
        if (prop.type === "number") schemaType = SchemaType.NUMBER;
        else if (prop.type === "boolean") schemaType = SchemaType.BOOLEAN;
        else if (prop.type === "array") schemaType = SchemaType.ARRAY;
        else if (prop.type === "object") schemaType = SchemaType.OBJECT;

        properties[key] = {
          type: schemaType,
          description: prop.description,
          ...(prop.enum ? { enum: prop.enum } : {}),
        };
      }

      return {
        name: t.name,
        description: t.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties,
          required: t.parameters.required || [],
        },
      };
    });

    const systemInstruction = `You are TripWise AI Travel Copilot, an intelligent, deterministic travel assistant.
You have access to 12 deterministic backend tools for calculations, database searches, weather, routing, and itinerary optimization.
CRITICAL RULES:
1. NEVER do travel calculations or budget math yourself. ALWAYS call the appropriate tool.
2. NEVER invent itinerary changes or prices. All changes MUST be executed via tools.
3. Keep answers concise, clear, and actionable. Use bullet points and currency format (₹).
User Context: Authorized UserId: ${context?.userId || "anonymous"}, Active TripId: ${context?.tripId || "none"}.`;

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction,
      tools: [{ functionDeclarations }],
    });

    // 2. Convert messages to Gemini history format
    const contents: any[] = [];
    for (const msg of messages) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.arguments,
              },
            });
          }
        }
        contents.push({ role: "model", parts });
      } else if (msg.role === "tool" && msg.toolResults) {
        for (const tr of msg.toolResults) {
          contents.push({
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: tr.name,
                  response: tr.result,
                },
              },
            ],
          });
        }
      }
    }

    // 3. Request generation from Gemini
    const result = await model.generateContent({ contents });
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate || !candidate.content || !candidate.content.parts) {
      return { content: response.text() || "I am ready to help you plan your journey." };
    }

    const toolCalls: ToolCallPayload[] = [];
    let textContent = "";

    for (const part of candidate.content.parts) {
      if (part.text) {
        textContent += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: part.functionCall.name,
          arguments: (part.functionCall.args as Record<string, unknown>) || {},
        });
      }
    }

    return {
      content: textContent.trim(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }
}

/**
 * DeterministicCopilotProvider serves as an offline-capable, testable model provider.
 * When GEMINI_API_KEY is not configured or in unit test runners, it deterministically
 * identifies the user's intent and triggers the appropriate backend tools directly.
 */
export class DeterministicCopilotProvider implements AIModelProvider {
  public readonly name = "TripWise Deterministic Provider (Offline/Test)";

  async generateResponse(
    messages: ChatMessage[],
    _tools: ToolDefinition[],
    context?: CopilotContext
  ): Promise<{
    content: string;
    toolCalls?: ToolCallPayload[];
  }> {
    const lastMessage = messages[messages.length - 1];

    // If the last message was a tool result, synthesize the final response
    if (lastMessage && lastMessage.role === "tool" && lastMessage.toolResults) {
      const resultsSummary = lastMessage.toolResults
        .map((r) => `${r.name}: ${JSON.stringify(r.result)}`)
        .join("\n");
      return {
        content: `I have processed your request using TripWise deterministic tools.\n${resultsSummary}`,
      };
    }

    const text = (lastMessage?.content || "").toLowerCase();
    const tripId = context?.tripId || "demo-trip-1";

    // Scenario: "I'm 45 minutes late. Re-plan my day."
    if (
      text.includes("late") ||
      text.includes("re-plan my day") ||
      text.includes("replan my day") ||
      text.includes("behind schedule") ||
      (text.includes("replan") && text.includes("day"))
    ) {
      const delayMatch = text.match(/(\d+)\s*(?:min|minute|minutes)/i);
      const delayMinutes = delayMatch ? parseInt(delayMatch[1], 10) : 45;

      return {
        content: `I'll re-plan your day for a ${delayMinutes}-minute delay while preserving your important landmarks and adjusting for opening hours and weather.`,
        toolCalls: [
          {
            id: `call_${Date.now()}_replan_day`,
            name: "replan_trip",
            arguments: {
              tripId,
              dayNumber: 1,
              delayMinutes,
              adjustmentGoal: "replan_day",
            },
          },
        ],
      };
    }

    // Scenario 1: "Make today's trip cheaper"
    if (text.includes("cheaper") || text.includes("save money") || text.includes("reduce budget") || text.includes("lower cost")) {
      return {
        content: "I'll analyze your budget and recalculate your trip with cost-saving adjustments.",
        toolCalls: [
          {
            id: `call_${Date.now()}_budget`,
            name: "calculate_budget",
            arguments: { tripId },
          },
          {
            id: `call_${Date.now()}_replan`,
            name: "replan_trip",
            arguments: { tripId, adjustmentGoal: "make_cheaper" },
          },
        ],
      };
    }

    // Scenario 2: "I don't want to visit the museum" / remove an item
    if (
      text.includes("museum") ||
      text.includes("don't want to visit") ||
      text.includes("remove") ||
      text.includes("skip")
    ) {
      return {
        content: "I'll fetch your current itinerary to locate that activity, remove it, and optimize your schedule.",
        toolCalls: [
          {
            id: `call_${Date.now()}_ctx`,
            name: "get_trip_context",
            arguments: { tripId },
          },
          {
            id: `call_${Date.now()}_opt`,
            name: "optimize_itinerary",
            arguments: { tripId, dayNumber: 1, strategy: "schedule_balance" },
          },
        ],
      };
    }

    // Scenario 3: "Find a restaurant near my hotel under ₹300"
    if (text.includes("restaurant") || text.includes("food") || text.includes("eat") || text.includes("dinner") || text.includes("lunch")) {
      // Extract price if specified (e.g. 300, 500)
      const priceMatch = text.match(/(?:under|below|less than|max|₹)\s*(\d+)/i) || text.match(/(\d+)\s*(?:rs|inr|rupees)/i);
      const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : 300;

      let destination = "Goa";
      if (text.includes("jaipur")) destination = "Jaipur";
      else if (text.includes("darjeeling")) destination = "Darjeeling";

      return {
        content: `Searching for top-rated restaurants in ${destination} under ₹${maxPrice} per person.`,
        toolCalls: [
          {
            id: `call_${Date.now()}_rest`,
            name: "search_restaurants",
            arguments: { destinationName: destination, maxPricePerPerson: maxPrice },
          },
        ],
      };
    }

    // Tool: search_hotels
    if (text.includes("hotel") || text.includes("resort") || text.includes("stay") || text.includes("room")) {
      let destination = "Goa";
      if (text.includes("jaipur")) destination = "Jaipur";
      else if (text.includes("darjeeling")) destination = "Darjeeling";

      return {
        content: `Searching accommodations in ${destination}.`,
        toolCalls: [
          {
            id: `call_${Date.now()}_hotel`,
            name: "search_hotels",
            arguments: { destinationName: destination, maxPricePerNight: 5000 },
          },
        ],
      };
    }

    // Tool: get_weather
    if (text.includes("weather") || text.includes("rain") || text.includes("temperature") || text.includes("forecast")) {
      let destination = "Goa";
      if (text.includes("jaipur")) destination = "Jaipur";
      else if (text.includes("darjeeling")) destination = "Darjeeling";

      return {
        content: `Fetching live weather conditions and forecast for ${destination}.`,
        toolCalls: [
          {
            id: `call_${Date.now()}_weather`,
            name: "get_weather",
            arguments: { destinationName: destination, days: 5 },
          },
        ],
      };
    }

    // Tool: calculate_route
    if (text.includes("route") || text.includes("distance") || text.includes("how far") || text.includes("directions")) {
      return {
        content: "Calculating deterministic route and travel duration via OSRM.",
        toolCalls: [
          {
            id: `call_${Date.now()}_route`,
            name: "calculate_route",
            arguments: {
              originLat: 15.2993,
              originLng: 74.124,
              destLat: 15.4989,
              destLng: 73.8278,
              mode: "driving",
            },
          },
        ],
      };
    }

    // Tool: calculate_visit_duration
    if (text.includes("visit duration") || text.includes("dwell time") || text.includes("how long to spend")) {
      return {
        content: "Evaluating visit duration based on attraction type and pace.",
        toolCalls: [
          {
            id: `call_${Date.now()}_dwell`,
            name: "calculate_visit_duration",
            arguments: {
              attractionName: "City Fort",
              durationTier: "Normal",
              travelPace: "moderate",
            },
          },
        ],
      };
    }

    // Tool: search_destinations
    if (text.includes("destination") || text.includes("where should i go") || text.includes("places to visit")) {
      return {
        content: "Searching available travel destinations.",
        toolCalls: [
          {
            id: `call_${Date.now()}_dest`,
            name: "search_destinations",
            arguments: { query: text },
          },
        ],
      };
    }

    // Tool: search_transport
    if (text.includes("flight") || text.includes("train") || text.includes("bus") || text.includes("transport") || text.includes("taxi")) {
      return {
        content: "Searching transit options and fares.",
        toolCalls: [
          {
            id: `call_${Date.now()}_transport`,
            name: "search_transport",
            arguments: { destinationName: "Goa", originCity: "Mumbai" },
          },
        ],
      };
    }

    // Tool: search_attractions
    if (text.includes("attraction") || text.includes("sight") || text.includes("fort") || text.includes("beach")) {
      return {
        content: "Searching attractions and sights.",
        toolCalls: [
          {
            id: `call_${Date.now()}_attr`,
            name: "search_attractions",
            arguments: { destinationName: "Goa" },
          },
        ],
      };
    }

    // Fallback: get_trip_context
    return {
      content: "Here is your current trip overview and schedule details.",
      toolCalls: [
        {
          id: `call_${Date.now()}_context`,
          name: "get_trip_context",
          arguments: { tripId },
        },
      ],
    };
  }
}

/**
 * GroqModelProvider integrates with Groq's ultra-fast LPU inference API.
 * Adheres strictly to the zero-authoritative-math rule:
 * Dispatches to backend deterministic tools for all calculations and mutations.
 */
export class GroqModelProvider implements AIModelProvider {
  public readonly name: string;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
    this.modelName = modelName || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    this.name = `Groq LPU (${this.modelName})`;
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required for GroqModelProvider.");
    }
  }

  async generateResponse(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    context?: CopilotContext
  ): Promise<{
    content: string;
    toolCalls?: ToolCallPayload[];
  }> {
    const formattedTools = tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: t.parameters.properties,
          required: t.parameters.required || [],
        },
      },
    }));

    const systemInstruction = `You are TripWise AI Travel Copilot, an intelligent, deterministic travel assistant running at ultra-fast Groq LPU speed.
You have access to 12 deterministic backend tools for calculations, database searches, weather, routing, and itinerary optimization.
CRITICAL RULES:
1. NEVER do travel calculations or budget math yourself. ALWAYS call the appropriate tool.
2. NEVER invent itinerary changes or prices. All changes MUST be executed via tools.
3. Keep answers concise, clear, and actionable. Use bullet points and currency format (₹).
User Context: Authorized UserId: ${context?.userId || "anonymous"}, Active TripId: ${context?.tripId || "none"}.`;

    const openAiMessages: any[] = [
      { role: "system", content: systemInstruction },
    ];

    for (const msg of messages) {
      if (msg.role === "user") {
        openAiMessages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        const item: any = { role: "assistant", content: msg.content || "" };
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          item.tool_calls = msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));
        }
        openAiMessages.push(item);
      } else if (msg.role === "tool" && msg.toolResults) {
        for (const tr of msg.toolResults) {
          openAiMessages.push({
            role: "tool",
            tool_call_id: tr.toolCallId,
            content: JSON.stringify(tr.result),
          });
        }
      }
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: openAiMessages,
        tools: formattedTools.length > 0 ? formattedTools : undefined,
        tool_choice: formattedTools.length > 0 ? "auto" : undefined,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const content = message?.content || "";

    const toolCalls: ToolCallPayload[] = (message?.tool_calls || []).map((tc: any) => {
      let args: Record<string, any> = {};
      try {
        args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
      } catch {
        args = {};
      }
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: args,
      };
    });

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }
}

/**
 * Factory to get the active AI model provider.
 * Allows swapping provider dynamically (Groq / Gemini) or falling back when API key is not present.
 */
export function getAIModelProvider(preferredProvider?: string): AIModelProvider {
  const provider = preferredProvider || process.env.AI_PROVIDER;

  // 1. Explicit Groq preference or Groq configured as default
  if (provider === "groq" || (!provider && process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY)) {
    try {
      return new GroqModelProvider();
    } catch {
      // Fall through to other providers
    }
  }

  // 2. Explicit Gemini preference or Gemini key available
  if (provider === "gemini" || (!provider && process.env.GEMINI_API_KEY)) {
    try {
      return new GeminiModelProvider();
    } catch {
      return new DeterministicCopilotProvider();
    }
  }

  // 3. Fallback to Groq if key exists
  if (process.env.GROQ_API_KEY) {
    try {
      return new GroqModelProvider();
    } catch {
      return new DeterministicCopilotProvider();
    }
  }

  // 4. Deterministic offline fallback
  return new DeterministicCopilotProvider();
}
