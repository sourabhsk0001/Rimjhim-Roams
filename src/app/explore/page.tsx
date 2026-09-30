"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DestinationCard, DemoBadge } from "@/components/travel/cards";
import { Destination } from "@/types/travel";

export default function ExplorePage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [climate, setClimate] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (climate !== "all") params.set("climate", climate);

      const res = await fetch(`/api/destinations?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load destinations.");
      }
      const data = await res.json();
      setDestinations(data.destinations || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error loading destination catalog."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDestinations();
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        {/* Header & Demo Disclaimer */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">Explore Destinations</h1>
                <DemoBadge />
              </div>
              <p className="text-muted-foreground text-sm">
                Discover verified Indian destinations, regional attractions, accommodations, and transit corridors.
              </p>
            </div>
          </div>

          <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">
              Phase 2 Core Travel Data Notice
            </AlertTitle>
            <AlertDescription className="text-xs">
              All attraction tickets, hotel rates, and transit schedules shown in this catalog are seeded
              <strong> DEMO DATA</strong> for architecture evaluation. No live booking APIs are fabricated.
            </AlertDescription>
          </Alert>
        </div>

        {/* Search & Filters */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border shadow-sm"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search by city, state, or region (e.g. Goa, Jaipur, Bengal)..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={climate}
              onChange={(e) => setClimate(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Climates</option>
              <option value="tropical">Tropical</option>
              <option value="semi-arid">Semi-Arid</option>
              <option value="alpine">Alpine / Hill Station</option>
              <option value="subtropical">Subtropical</option>
            </select>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error Loading Catalog</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading travel catalog...</p>
          </div>
        ) : destinations.length === 0 ? (
          /* Empty State */
          <Card className="border-dashed p-12 text-center space-y-4 bg-card/50">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-semibold text-lg">No destinations found</h3>
              <p className="text-sm text-muted-foreground">
                No destinations matched &quot;{search}&quot;. Try adjusting your keywords or clearing the climate filter.
              </p>
            </div>
          </Card>
        ) : (
          /* Destination Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {destinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
