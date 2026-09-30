"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Luggage,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  Shirt,
  FileText,
  Sparkle,
  Zap,
  CloudSun,
  Activity,
  CheckSquare,
  Square,
  ShieldAlert,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PackingCategory,
  PackingItem,
  PackingListSummary,
} from "@/types/travel-management";

const CATEGORY_ICONS: Record<PackingCategory, any> = {
  Clothing: Shirt,
  Documents: FileText,
  Toiletries: Sparkle,
  Electronics: Zap,
  Weather: CloudSun,
  "Activity-specific": Activity,
};

export default function TripPackingPage() {
  const params = useParams();
  const tripId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PackingListSummary | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");

  // Custom Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<PackingCategory>("Clothing");
  const [newItemName, setNewItemName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newEssential, setNewEssential] = useState(false);
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchPackingList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/trips/${tripId}/packing`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load packing list");
      }

      setSummary(data.summary);
      setItems(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error connecting to packing service.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchPackingList();
    }
  }, [tripId, fetchPackingList]);

  // Handle Item Checkbox Toggle
  const handleToggleItem = async (itemId: string, currentPacked: boolean) => {
    const nextPacked = !currentPacked;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, packed: nextPacked } : item))
    );

    try {
      const res = await fetch(`/api/trips/${tripId}/packing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, packed: nextPacked }),
      });
      if (!res.ok) {
        throw new Error("Failed to update item");
      }
      // Refresh summary statistics
      fetchPackingList();
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, packed: currentPacked } : item))
      );
    }
  };

  // Handle Toggle Entire Category
  const handleToggleCategory = async (category: PackingCategory, targetPacked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.category === category ? { ...item, packed: targetPacked } : item))
    );

    try {
      await fetch(`/api/trips/${tripId}/packing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_category", category, packed: targetPacked }),
      });
      fetchPackingList();
    } catch {
      fetchPackingList();
    }
  };

  // Handle Add Custom Item
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          item_name: newItemName,
          quantity: newQuantity,
          essential: newEssential,
          notes: newNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add item");
      }

      setShowAddModal(false);
      setNewItemName("");
      setNewQuantity(1);
      setNewEssential(false);
      setNewNotes("");
      fetchPackingList();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding item");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item?")) return;

    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/trips/${tripId}/packing?itemId=${itemId}`, {
        method: "DELETE",
      });
      fetchPackingList();
    } catch {
      fetchPackingList();
    }
  };

  // Handle Regenerate
  const handleRegenerate = async () => {
    if (
      !confirm(
        "Regenerate your packing list? This will adapt items to the latest weather forecast and itinerary schedule."
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/packing/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate list");
      setSummary(data.summary);
      setItems(data.items || []);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error regenerating list");
    } finally {
      setRegenerating(false);
    }
  };

  const categoriesOrder: PackingCategory[] = [
    "Clothing",
    "Documents",
    "Toiletries",
    "Electronics",
    "Weather",
    "Activity-specific",
  ];

  const filteredCategories =
    activeCategoryFilter === "All"
      ? categoriesOrder
      : categoriesOrder.filter((c) => c === activeCategoryFilter);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link href={`/trips/${tripId}`}>
              <ArrowLeft className="w-4 h-4" /> Back to Trip Details
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="gap-1.5 border-slate-300 text-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
              Regenerate Checklist
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-muted-foreground text-sm font-medium">
              Generating your intelligent packing checklist...
            </p>
          </div>
        ) : (
          <>
            {/* Packing Overview Hero Card */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-background shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                      <Luggage className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Packing Intelligence: {summary?.factorsUsed.destination}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Adaptive packing generated from {summary?.factorsUsed.duration} days of travel,
                        weather data, and scheduled itinerary activities.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-700 font-mono">
                      {summary?.percentage || 0}%
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {summary?.packedItems || 0} of {summary?.totalItems || 0} packed
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${summary?.percentage || 0}%` }}
                  />
                </div>

                {/* Factors Callout */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Badge variant="secondary" className="text-[11px]">
                    {summary?.factorsUsed.duration} Days
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] capitalize">
                    {summary?.factorsUsed.travellerType} Traveller
                  </Badge>
                  {summary?.factorsUsed.weatherCondition && (
                    <Badge variant="outline" className="border-sky-300 text-sky-800 bg-sky-50 text-[11px]">
                      Weather: {summary.factorsUsed.weatherCondition}
                    </Badge>
                  )}
                  {summary?.factorsUsed.temperature !== undefined && (
                    <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-[11px]">
                      {Math.round(summary.factorsUsed.temperature)}°C Forecast
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[11px]">
                    {summary?.factorsUsed.activitiesCount || 0} Activities Factored
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
              {["All", ...categoriesOrder].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                    activeCategoryFilter === cat
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Categorized Checklists */}
            <div className="space-y-6">
              {filteredCategories.map((category) => {
                const categoryItems = items.filter((i) => i.category === category);
                const IconComponent = CATEGORY_ICONS[category] || Luggage;
                const packedCount = categoryItems.filter((i) => i.packed).length;
                const allPacked = categoryItems.length > 0 && packedCount === categoryItems.length;

                return (
                  <Card key={category} className="border shadow-xs">
                    <CardHeader className="py-3 bg-slate-50/70 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <h3 className="font-bold text-sm text-foreground">
                            {category} ({packedCount}/{categoryItems.length})
                          </h3>
                        </div>

                        {categoryItems.length > 0 && (
                          <button
                            onClick={() => handleToggleCategory(category, !allPacked)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {allPacked ? "Uncheck All" : "Check All"}
                          </button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 divide-y">
                      {categoryItems.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          No items in this category yet.
                        </div>
                      ) : (
                        categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between p-3.5 hover:bg-slate-50/60 transition gap-3 ${
                              item.packed ? "bg-slate-50/40" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleItem(item.id, item.packed)}
                                className="mt-0.5 text-blue-600 hover:scale-110 transition shrink-0"
                                aria-label={item.packed ? "Mark as unpacked" : "Mark as packed"}
                              >
                                {item.packed ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400" />
                                )}
                              </button>

                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-sm font-medium leading-snug break-words ${
                                      item.packed
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {item.item_name}
                                  </span>

                                  {item.quantity > 1 && (
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                      ×{item.quantity}
                                    </Badge>
                                  )}

                                  {item.essential && (
                                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] py-0 px-1.5 h-4 font-semibold">
                                      Essential
                                    </Badge>
                                  )}

                                  {item.is_custom && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-purple-700 border-purple-300">
                                      Custom
                                    </Badge>
                                  )}
                                </div>

                                {item.notes && (
                                  <p className="text-xs text-muted-foreground">{item.notes}</p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-400 hover:text-red-600 transition p-1"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Add Custom Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base">Add Item to Packing List</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomItem} className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-xs">
                    Category
                  </Label>
                  <select
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PackingCategory)}
                    className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                  >
                    {categoriesOrder.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="itemName" className="text-xs">
                    Item Name *
                  </Label>
                  <Input
                    id="itemName"
                    placeholder="e.g. Scuba diving goggles, Extra camera battery"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantity" className="text-xs">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="99"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="essential"
                      checked={newEssential}
                      onChange={(e) => setNewEssential(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <Label htmlFor="essential" className="text-xs cursor-pointer">
                      Mark as Essential
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs">
                    Notes (Optional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="e.g. Pack in carry-on bag"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? "Adding..." : "Add to List"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
