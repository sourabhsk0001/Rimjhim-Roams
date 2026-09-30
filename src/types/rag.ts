// ==============================================================================
// Phase 10: Travel RAG Domain Types, Schemas & Security Models
// ==============================================================================

export type KnowledgeCategory =
  | "safety"
  | "legal"
  | "permits"
  | "health"
  | "cultural_norms"
  | "transit"
  | "scams"
  | "weather_hazards"
  | "general";

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  destination: string;
  category: KnowledgeCategory;
  published_at: string;
  updated_at: string;
  retrieved_at?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  chunksCount?: number;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  title: string;
  content: string;
  source: string;
  destination: string;
  category: KnowledgeCategory;
  token_count: number;
  embedding: number[];
  metadata: Record<string, unknown>;
  retrieved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestDocumentInput {
  title: string;
  content: string;
  source: string;
  destination?: string;
  category?: KnowledgeCategory;
  published_at?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchKnowledgeFilters {
  destination?: string;
  category?: string;
  minSimilarity?: number;
  limit?: number;
}

export interface KnowledgeSearchResult {
  chunk: KnowledgeChunk;
  similarity: number;
}

export interface Citation {
  source: string;
  title: string;
  destination: string;
  category: string;
  chunkId: string;
  excerpt: string;
  similarity: number;
  url?: string;
}

export interface RagAnswerResponse {
  question: string;
  answer: string;
  citations: Citation[];
  retrievedChunks: Array<{
    title: string;
    source: string;
    similarity: number;
    destination: string;
    category: string;
  }>;
  confidenceScore: number;
  disclaimer: string;
  securityNotice?: string;
}

export interface PromptInjectionAnalysis {
  isSafe: boolean;
  threatLevel: "none" | "low" | "medium" | "high";
  sanitizedText: string;
  flaggedPatterns: string[];
}
