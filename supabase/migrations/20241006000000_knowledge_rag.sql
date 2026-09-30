-- ==============================================================================
-- Migration: 20241006000000_knowledge_rag.sql
-- Description: Phase 10 Production Travel RAG System with PostgreSQL & pgvector
-- ==============================================================================

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Knowledge Documents Table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  destination text NOT NULL DEFAULT 'All India',
  category text NOT NULL DEFAULT 'general',
  published_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  retrieved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_dest ON public.knowledge_documents(destination);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_category ON public.knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_source ON public.knowledge_documents(source);

-- 3. Knowledge Chunks Table with Vector Embeddings
-- Uses 768 dimensions matching Google Gemini text-embedding-004 model
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  destination text NOT NULL DEFAULT 'All India',
  category text NOT NULL DEFAULT 'general',
  token_count integer DEFAULT 0 NOT NULL,
  embedding vector(768) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  retrieved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_id ON public.knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_dest ON public.knowledge_chunks(destination);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_category ON public.knowledge_chunks(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON public.knowledge_chunks(source);

-- Vector Cosine Similarity Index (HNSW / ivfflat fallback)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Vector Match Procedure for Cosine Distance Retrieval
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.40,
  match_count int DEFAULT 5,
  filter_destination text DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  title text,
  content text,
  source text,
  destination text,
  category text,
  token_count int,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.chunk_index,
    c.title,
    c.content,
    c.source,
    c.destination,
    c.category,
    c.token_count,
    c.metadata,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.knowledge_chunks c
  WHERE (
      filter_destination IS NULL
      OR c.destination ILIKE filter_destination
      OR c.destination = 'All India'
    )
    AND (
      filter_category IS NULL
      OR c.category ILIKE filter_category
    )
    AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
  ORDER BY c.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 5. Row Level Security (RLS)
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Read Access: All users (including public/travelers) can search and read knowledge base
CREATE POLICY "Public read access for knowledge documents"
  ON public.knowledge_documents
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for knowledge chunks"
  ON public.knowledge_chunks
  FOR SELECT
  USING (true);

-- Write Access: Authenticated users / admins can ingest and update
CREATE POLICY "Authenticated users can insert knowledge documents"
  ON public.knowledge_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge documents"
  ON public.knowledge_documents
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete knowledge documents"
  ON public.knowledge_documents
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert knowledge chunks"
  ON public.knowledge_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge chunks"
  ON public.knowledge_chunks
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete knowledge chunks"
  ON public.knowledge_chunks
  FOR DELETE
  TO authenticated
  USING (true);
