"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolExecutionEvent } from "@/types/ai";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolEvents?: ToolExecutionEvent[];
  suggestedActions?: string[];
  timestamp: string;
}

interface CopilotChatProps {
  tripId?: string;
  initialMessage?: string;
  tripSummary?: {
    origin: string;
    destination: string;
    durationDays: number;
    budget: number;
    currency: string;
  };
}

export function CopilotChat({ tripId, initialMessage, tripSummary }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatEntry[]>(() => {
    const defaultGreeting: ChatEntry = {
      id: "welcome-1",
      role: "assistant",
      content: tripId
        ? `Hello! I am your TripWise AI Copilot for this trip to **${tripSummary?.destination || "your destination"}**. I use deterministic calculations, PostGIS routing, and real meteorological data. You can ask me to optimize costs, adjust activities, find restaurants, or check weather impacts.`
        : "Hello! I am your TripWise Travel Copilot. Ask me where to travel on a budget, look up attractions and hotels, calculate precise travel routes, or check live weather forecasts.",
      suggestedActions: tripId
        ? [
            "Make today's trip cheaper",
            "I don't want to visit the museum",
            "Find a restaurant near my hotel under ₹300",
          ]
        : [
            "Where can I travel for ₹20,000?",
            "Find beach resorts in Goa",
            "Budget heritage hotels in Jaipur",
          ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    return [defaultGreeting];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>("TripWise AI Copilot");
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleToolExpanded = (toolKey: string) => {
    setExpandedTools((prev) => ({ ...prev, [toolKey]: !prev[toolKey] }));
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build lightweight conversation history for the copilot
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          tripId: tripId || undefined,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to receive response from Travel Copilot.");
      }

      if (data.provider) {
        setActiveProvider(data.provider);
      }

      const assistantMessage: ChatEntry = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I have analyzed your request.",
        toolEvents: data.toolEvents || [],
        suggestedActions: data.suggestedActions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Error**: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] bg-background border rounded-2xl shadow-sm overflow-hidden">
      {/* Copilot Header */}
      <div className="px-5 py-3.5 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                TripWise AI Travel Copilot
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                Deterministic Engine
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3 h-3 text-emerald-500" />
              Zero calculation drift • Grounded in PostGIS & Weather APIs
            </p>
          </div>
        </div>

        {tripId && (
          <div className="hidden sm:flex items-center gap-2 text-xs bg-muted/60 px-3 py-1.5 rounded-lg border">
            <span className="text-muted-foreground">Active Trip:</span>
            <span className="font-semibold text-foreground">
              {tripSummary ? `${tripSummary.origin} → ${tripSummary.destination}` : "Loaded"}
            </span>
          </div>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-4 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 shadow-sm"
                  : "bg-muted/40 border text-foreground rounded-2xl rounded-tl-none p-4 shadow-sm"
              }`}
            >
              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Tool Execution Display (Deterministic Tools) */}
              {msg.toolEvents && msg.toolEvents.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Wrench className="w-3.5 h-3.5 text-blue-500" />
                    <span>Tools Executed:</span>
                  </div>

                  <div className="space-y-1.5">
                    {msg.toolEvents.map((event, toolIdx) => {
                      const toolKey = `${msg.id}-${event.toolName}-${toolIdx}`;
                      const isExpanded = !!expandedTools[toolKey];
                      const isSuccess = event.status === "success";

                      return (
                        <div
                          key={toolKey}
                          className="bg-card border rounded-lg text-xs overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleToolExpanded(toolKey)}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors text-left font-mono"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isSuccess ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-foreground">
                                {event.toolName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                              <span className="text-[11px] font-sans flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.durationMs}ms
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-3 bg-muted/20 border-t space-y-2 font-mono text-[11px]">
                              <div>
                                <span className="text-muted-foreground font-sans font-semibold">
                                  Arguments:
                                </span>
                                <pre className="mt-1 p-2 bg-background border rounded text-foreground overflow-x-auto">
                                  {JSON.stringify(event.arguments, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-sans font-semibold">
                                  Structured Result:
                                </span>
                                <pre className="mt-1 p-2 bg-background border rounded text-foreground overflow-x-auto">
                                  {JSON.stringify(event.output, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contextual Action Button if Replanned or Optimized */}
                  {tripId &&
                    msg.toolEvents.some(
                      (e) =>
                        e.toolName === "replan_trip" ||
                        e.toolName === "optimize_itinerary" ||
                        e.toolName === "calculate_budget"
                    ) && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          asChild
                          className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                        >
                          <Link href={`/trips/${tripId}`}>
                            Apply Changes & View Itinerary
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          asChild
                          variant="outline"
                          className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Link href={`/trips/${tripId}/budget`}>
                            Inspect Budget Breakdown
                          </Link>
                        </Button>
                      </div>
                    )}
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] ${
                  msg.role === "user" ? "text-primary-foreground/75" : "text-muted-foreground"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 sm:gap-4 items-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted/40 border rounded-2xl rounded-tl-none p-4 text-xs text-muted-foreground flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              Executing deterministic backend tools and calculating schedule...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Action Quick Pills */}
      {messages.length > 0 &&
        messages[messages.length - 1].suggestedActions &&
        (messages[messages.length - 1].suggestedActions?.length || 0) > 0 && (
          <div className="px-4 py-2 border-t bg-muted/20 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Try:
            </span>
            {messages[messages.length - 1].suggestedActions?.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(action)}
                disabled={loading}
                className="text-xs bg-card hover:bg-muted border px-2.5 py-1 rounded-full text-foreground/80 hover:text-foreground transition-colors truncate max-w-[260px]"
              >
                {action}
              </button>
            ))}
          </div>
        )}

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                tripId
                  ? "Ask Copilot: 'Make today's trip cheaper', 'Remove museum', or 'Find restaurants'..."
                  : "Ask Copilot: 'Plan a trip to Darjeeling under ₹25,000'..."
              }
              rows={2}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>Press Enter to send • Shift + Enter for newline</span>
          <span className="font-mono">{activeProvider}</span>
        </div>
      </div>
    </div>
  );
}
