"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  X,
  Send,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeDocument, KnowledgeCategory, RagAnswerResponse } from "@/types/rag";

const CATEGORIES: KnowledgeCategory[] = [
  "safety",
  "legal",
  "permits",
  "health",
  "cultural_norms",
  "transit",
  "scams",
  "weather_hazards",
  "general",
];

const DESTINATIONS = ["All India", "Goa", "Jaipur", "Sikkim", "Manali", "Darjeeling", "Delhi", "Mumbai"];

export default function AdminKnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Inspect Modal State
  const [inspectDoc, setInspectDoc] = useState<(KnowledgeDocument & { chunks?: any[] }) | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Edit / Create Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    source: "",
    destination: "All India",
    category: "safety" as KnowledgeCategory,
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // RAG Playground State
  const [ragQuestion, setRagQuestion] = useState("Is it safe to swim at the beaches in Goa during July?");
  const [ragDestination, setRagDestination] = useState("Goa");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResponse, setRagResponse] = useState<RagAnswerResponse | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (selectedDestination) params.set("destination", selectedDestination);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/admin/knowledge?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load knowledge documents:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDestination, selectedCategory]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      source: "",
      destination: "All India",
      category: "safety",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (doc: KnowledgeDocument) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      content: doc.content,
      source: doc.source,
      destination: doc.destination,
      category: doc.category,
    });
    setIsFormOpen(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.source.trim()) {
      alert("Please fill in Title, Content, and Source.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/knowledge/${editingId}` : "/api/admin/knowledge";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setIsFormOpen(false);
      loadDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" and all its vector chunks?`)) return;

    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadDocuments();
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleInspect = async (id: string) => {
    try {
      setLoadingInspect(true);
      const res = await fetch(`/api/admin/knowledge/${id}`);
      const data = await res.json();
      if (data.success && data.document) {
        setInspectDoc(data.document);
      }
    } catch (err) {
      console.error("Failed to inspect document:", err);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleSeedAuthoritative = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/admin/knowledge/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadDocuments();
      }
    } catch (err) {
      console.error("Seeding failed:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleAskRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuestion.trim()) return;

    setRagLoading(true);
    setRagResponse(null);
    try {
      const res = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: ragQuestion.trim(),
          destination: ragDestination || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRagResponse(data);
      } else {
        alert(data.error || "RAG Q&A failed");
      }
    } catch (err) {
      console.error("RAG request failed:", err);
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header Banner */}
        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Phase 10: PostgreSQL + pgvector RAG System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Authoritative Travel Knowledge Base
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ingest, chunk, embed, and query authoritative civil guidelines, safety protocols, and travel permits.
              Includes semantic search with cosine distance and strict protection against prompt injection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedAuthoritative}
              disabled={seeding}
              className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
              {seeding ? "Ingesting..." : "Seed Authoritative Data"}
            </Button>

            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Knowledge Document
            </Button>
          </div>
        </div>

        {/* Section 1: Interactive RAG Testing Playground */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground">
                  Grounded Travel Q&A (RAG Playground)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Test vector retrieval, prompt injection defense, and non-hallucinatory citation generation.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAskRag} className="space-y-3">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex-1 min-w-[280px]">
                <input
                  type="text"
                  value={ragQuestion}
                  onChange={(e) => setRagQuestion(e.target.value)}
                  placeholder="Ask a legal, safety, or travel question (e.g. 'Is swimming safe in Goa in July?')..."
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <select
                value={ragDestination}
                onChange={(e) => setRagDestination(e.target.value)}
                className="px-3 py-2.5 rounded-xl border bg-background text-xs font-medium text-foreground"
              >
                <option value="">All Destinations</option>
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                disabled={ragLoading || !ragQuestion.trim()}
                className="h-10 px-5 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl"
              >
                {ragLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Ask RAG
              </Button>
            </div>
          </form>

          {/* RAG Answer Display */}
          {ragResponse && (
            <div className="p-5 rounded-xl bg-muted/30 border space-y-4 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Grounded Response:
                  </span>
                  <span className="text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    Similarity: {Math.round((ragResponse.confidenceScore || 0.8) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {ragResponse.answer}
                </p>
              </div>

              {/* Citations (Invariant: Never fabricate sources) */}
              {ragResponse.citations && ragResponse.citations.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Verified Source Citations:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {ragResponse.citations.map((c, i) => (
                      <div
                        key={i}
                        className="bg-card border rounded-lg p-3 text-xs space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-foreground truncate">{c.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex-shrink-0">
                            {c.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          🏛️ {c.source}
                        </p>
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                          &quot;{c.excerpt}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t">
                <span>{ragResponse.disclaimer}</span>
                {ragResponse.securityNotice && (
                  <span className="text-amber-600 font-semibold">{ragResponse.securityNotice}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Knowledge Documents Database & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Indexed Knowledge Documents ({documents.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter documents..."
                  className="pl-9 pr-3 py-1.5 rounded-lg border bg-background text-xs w-[180px] sm:w-[220px]"
                />
              </div>

              {/* Destination Filter */}
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border bg-background text-xs text-foreground"
              >
                <option value="">All Destinations</option>
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border bg-background text-xs text-foreground"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents Grid / Table */}
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
              Loading indexed documents and pgvector chunks...
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-card border rounded-2xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base text-foreground">No documents found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No knowledge records match your filters. Click &quot;Seed Authoritative Data&quot; to populate official travel guidelines.
              </p>
              <Button size="sm" onClick={handleSeedAuthoritative} disabled={seeding}>
                Seed Default Knowledge
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-card border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {doc.destination}
                      </span>
                      <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {doc.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                      {doc.title}
                    </h3>

                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      🏛️ {doc.source}
                    </p>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {doc.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span className="flex items-center gap-1 font-mono">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        {doc.chunksCount || 1} chunks
                      </span>
                      <span>{new Date(doc.published_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInspect(doc.id)}
                        className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Inspect Chunks
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(doc)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal 1: Create / Edit Document */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-card border rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-foreground">
                  {editingId ? "Edit Knowledge Document" : "Ingest Knowledge Document"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Document Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Protected Area Permits for Sikkim"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Authoritative Source</label>
                    <input
                      type="text"
                      required
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="e.g. Ministry of Tourism"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Destination</label>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="e.g. Goa, Jaipur, or All India"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as KnowledgeCategory })
                      }
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Document Body Content</label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter full text of travel advisory, law, permit rules, or safety guidelines. Will be automatically cleaned, chunked, and embedded into pgvector..."
                    className="w-full p-3 rounded-xl border bg-background text-sm resize-y font-mono text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingId ? "Update & Re-Index" : "Clean, Chunk & Ingest"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Inspect Document & pgvector Chunks */}
        {inspectDoc && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-card border rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Source Metadata Inspector
                  </span>
                  <h3 className="font-bold text-lg text-foreground">{inspectDoc.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectDoc(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/30 p-3 rounded-xl">
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <p className="font-semibold text-foreground">{inspectDoc.source}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destination:</span>
                    <p className="font-semibold text-foreground">{inspectDoc.destination}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-semibold text-foreground">{inspectDoc.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Chunks:</span>
                    <p className="font-semibold text-foreground font-mono">
                      {inspectDoc.chunks?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Generated pgvector Chunks
                  </h4>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {inspectDoc.chunks && inspectDoc.chunks.length > 0 ? (
                      inspectDoc.chunks.map((chunk, idx) => (
                        <div
                          key={chunk.id || idx}
                          className="bg-muted/20 border rounded-xl p-3 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                            <span className="font-bold text-foreground">
                              Chunk #{chunk.chunk_index + 1}
                            </span>
                            <span>~{chunk.token_count || Math.ceil(chunk.content.length / 4)} tokens</span>
                          </div>
                          <p className="font-mono text-[11px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {chunk.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">No chunks loaded.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button size="sm" onClick={() => setInspectDoc(null)}>
                  Close Inspector
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
