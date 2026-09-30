"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  Ban,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ShieldCheck,
  Compass,
  Hotel,
  UtensilsCrossed,
  Train,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TravelMemory,
  MemoryCategory,
  MemoryType,
  UserTravelMemoriesSummary,
} from "@/types/memories";

const CATEGORY_ICONS: Record<MemoryCategory, React.ComponentType<{ className?: string }>> = {
  destination: Compass,
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  transit: Train,
  itinerary: Calendar,
  general: Layers,
};

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  destination: "Destinations & Sights",
  hotel: "Hotels & Stays",
  restaurant: "Food & Dining",
  transit: "Transit & Modes",
  itinerary: "Pacing & Schedule",
  general: "General Preferences",
};

const SUGGESTIONS: Array<{ type: MemoryType; category: MemoryCategory; keyword: string; notes: string }> = [
  { type: "like", category: "destination", keyword: "Nature", notes: "Loves mountain viewpoints, waterfalls, and scenic hill country" },
  { type: "like", category: "restaurant", keyword: "Local food", notes: "Prefers authentic regional dining and iconic food culture" },
  { type: "like", category: "hotel", keyword: "Budget hotels", notes: "Prefers cozy, cost-effective stays and value lodges" },
  { type: "like", category: "transit", keyword: "Train travel", notes: "Enjoys scenic rail routes and Indian Railways sleeper/express options" },
  { type: "avoid", category: "hotel", keyword: "Luxury hotels", notes: "Avoids expensive 5-star chains and overpriced resort markups" },
  { type: "avoid", category: "itinerary", keyword: "Overpacked itineraries", notes: "Prefers a relaxed daily pace with ample rest and buffer time" },
];

export default function MemoriesPage() {
  const [memories, setMemories] = useState<TravelMemory[]>([]);
  const [summary, setSummary] = useState<UserTravelMemoriesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<MemoryType>("like");
  const [formCategory, setFormCategory] = useState<MemoryCategory>("general");
  const [formKeyword, setFormKeyword] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memories");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load travel memories.");
      }
      setMemories(data.memories || []);
      setSummary(data.summary || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading memories.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormType("like");
    setFormCategory("destination");
    setFormKeyword("");
    setFormNotes("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(memory: TravelMemory) {
    setEditingId(memory.id);
    setFormType(memory.type);
    setFormCategory(memory.category);
    setFormKeyword(memory.keyword);
    setFormNotes(memory.notes || "");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formKeyword.trim()) {
      setError("Please specify a preference keyword.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingId) {
        // Edit
        const res = await fetch(`/api/memories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formType,
            category: formCategory,
            keyword: formKeyword.trim(),
            notes: formNotes.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update memory.");
        setSuccessMsg(`Updated preference "${formKeyword}" successfully.`);
      } else {
        // Create
        const res = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formType,
            category: formCategory,
            keyword: formKeyword.trim(),
            notes: formNotes.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create memory.");
        setSuccessMsg(`Remembered "${formKeyword}" for future trips!`);
      }

      setIsModalOpen(false);
      await loadMemories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, keyword: string) {
    if (!confirm(`Are you sure you want to forget "${keyword}"?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete memory.");

      setSuccessMsg(`Permanently removed "${keyword}".`);
      await loadMemories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete memory.");
    }
  }

  async function handleAddSuggestion(s: typeof SUGGESTIONS[0]) {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save suggestion.");

      setSuccessMsg(`Added "${s.keyword}" to your travel preferences.`);
      await loadMemories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add suggestion.");
    }
  }

  const filteredMemories = memories.filter((m) =>
    categoryFilter === "all" ? true : m.category === categoryFilter
  );

  const likesList = filteredMemories.filter((m) => m.type === "like");
  const avoidsList = filteredMemories.filter((m) => m.type === "avoid");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Travel Memories</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              TripWise remembers your useful non-sensitive travel preferences to automatically tailor destination discovery, hotels, restaurants, itineraries, and AI advice.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm shrink-0">
            <Plus className="w-4 h-4" />
            Add Travel Preference
          </Button>
        </div>

        {/* Privacy Guard Notice */}
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm leading-relaxed">
            <strong className="font-semibold block text-emerald-900 dark:text-emerald-100 mb-0.5">
              Strict Non-Sensitive Privacy Guarantee
            </strong>
            TripWise only stores personal travel tastes (such as dining, transit choices, lodging comfort, and pacing). Sensitive data (passwords, card numbers, government IDs, and medical records) are strictly prevented and rejected. You maintain total control and can view, edit, or delete any memory at any time.
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="mb-6 border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* Quick Suggestion Chips */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Quick Add Popular Preferences
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, idx) => {
              const alreadyExists = memories.some(
                (m) => m.keyword.toLowerCase() === s.keyword.toLowerCase() && m.type === s.type
              );
              if (alreadyExists) return null;

              return (
                <button
                  key={idx}
                  onClick={() => handleAddSuggestion(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    s.type === "like"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200 hover:bg-rose-500/20"
                  }`}
                >
                  {s.type === "like" ? <Heart className="w-3.5 h-3.5 text-emerald-600" /> : <Ban className="w-3.5 h-3.5 text-rose-600" />}
                  <span>+ {s.type === "like" ? "Likes" : "Avoids"} {s.keyword}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b pb-4">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({memories.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map((cat) => {
            const count = memories.filter((m) => m.category === cat).length;
            const Icon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{CATEGORY_LABELS[cat]} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Content Lists */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm">Loading your travel memories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LIKES COLUMN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Heart className="w-4 h-4 fill-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">What You Like</h2>
                    <p className="text-xs text-muted-foreground">Boosted in recommendations and itineraries</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                  {likesList.length} Saved
                </Badge>
              </div>

              {likesList.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <p className="text-sm">No likes saved in this category yet.</p>
                  <Button variant="link" size="sm" onClick={handleOpenCreate} className="mt-1">
                    + Add your first like
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {likesList.map((mem) => {
                    const CatIcon = CATEGORY_ICONS[mem.category];
                    return (
                      <Card key={mem.id} className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-base">{mem.keyword}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                                <CatIcon className="w-3 h-3" />
                                {CATEGORY_LABELS[mem.category]}
                              </Badge>
                            </div>
                            {mem.notes && (
                              <CardDescription className="text-xs text-foreground/80 mt-1">
                                {mem.notes}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(mem)}
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(mem.id, mem.keyword)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AVOIDS COLUMN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">What You Avoid</h2>
                    <p className="text-xs text-muted-foreground">Excluded or minimized during trip planning</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                  {avoidsList.length} Saved
                </Badge>
              </div>

              {avoidsList.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <p className="text-sm">No avoided preferences saved yet.</p>
                  <Button variant="link" size="sm" onClick={handleOpenCreate} className="mt-1">
                    + Add an avoided preference
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {avoidsList.map((mem) => {
                    const CatIcon = CATEGORY_ICONS[mem.category];
                    return (
                      <Card key={mem.id} className="border-l-4 border-l-rose-500 shadow-sm hover:shadow transition-shadow">
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-base">{mem.keyword}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                                <CatIcon className="w-3 h-3" />
                                {CATEGORY_LABELS[mem.category]}
                              </Badge>
                            </div>
                            {mem.notes && (
                              <CardDescription className="text-xs text-foreground/80 mt-1">
                                {mem.notes}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(mem)}
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(mem.id, mem.keyword)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for Create / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-xl border bg-card">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {editingId ? "Edit Travel Preference" : "Add Travel Preference"}
                  </CardTitle>
                  <CardDescription>
                    TripWise remembers this preference to guide future trips and AI recommendations.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Type Selector */}
                  <div>
                    <Label className="text-xs font-semibold">Preference Type</Label>
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setFormType("like")}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                          formType === "like"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20"
                            : "border-input hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        <span>I Like This</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormType("avoid")}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                          formType === "avoid"
                            ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20"
                            : "border-input hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Ban className="w-4 h-4 text-rose-600" />
                        <span>I Avoid This</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Picker */}
                  <div>
                    <Label htmlFor="category" className="text-xs font-semibold">
                      Category
                    </Label>
                    <select
                      id="category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                      className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="destination">Destinations & Sights</option>
                      <option value="hotel">Hotels & Stays</option>
                      <option value="restaurant">Food & Dining</option>
                      <option value="transit">Transit & Modes</option>
                      <option value="itinerary">Pacing & Schedule</option>
                      <option value="general">General Preferences</option>
                    </select>
                  </div>

                  {/* Keyword */}
                  <div>
                    <Label htmlFor="keyword" className="text-xs font-semibold">
                      Preference Keyword <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="keyword"
                      value={formKeyword}
                      onChange={(e) => setFormKeyword(e.target.value)}
                      placeholder="e.g. Nature, Local food, Budget hotels, Train travel"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes" className="text-xs font-semibold">
                      Context / Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Prefers authentic regional street food, avoids continental fast food chains"
                      rows={3}
                      className="mt-1.5 text-sm"
                    />
                  </div>
                </CardContent>

                <div className="p-6 pt-2 flex items-center justify-end gap-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update Memory"
                    ) : (
                      "Save Memory"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
