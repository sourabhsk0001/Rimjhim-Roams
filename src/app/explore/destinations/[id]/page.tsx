"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Sun,
  Compass,
  Building,
  Utensils,
  Car,
  Navigation as NavIcon,
  AlertCircle,
  Loader2,
  Radar,
  Info,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AttractionCard,
  HotelCard,
  RestaurantCard,
  TransportCard,
  TaxiCard,
  DemoBadge,
} from "@/components/travel/cards";
import {
  Destination,
  Attraction,
  Hotel,
  Restaurant,
  TransportOption,
  TaxiOption,
  NearbyLocationResult,
} from "@/types/travel";

export default function DestinationDetailPage() {
  const params = useParams();
  const destId = params.id as string;

  const [destination, setDestination] = useState<Destination | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [transport, setTransport] = useState<TransportOption[]>([]);
  const [taxis, setTaxis] = useState<TaxiOption[]>([]);

  // PostGIS Nearby Radius Search
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [nearbyResults, setNearbyResults] = useState<NearbyLocationResult[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "attractions" | "hotels" | "restaurants" | "transport" | "nearby"
  >("attractions");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!destId) return;
      setLoading(true);
      setError(null);

      try {
        const [dRes, aRes, hRes, rRes, tRes] = await Promise.all([
          fetch(`/api/destinations/${destId}`),
          fetch(`/api/destinations/${destId}/attractions`),
          fetch(`/api/destinations/${destId}/hotels`),
          fetch(`/api/destinations/${destId}/restaurants`),
          fetch(`/api/destinations/${destId}/transport`),
        ]);

        if (!dRes.ok) throw new Error("Destination not found");

        const [dData, aData, hData, rData, tData] = await Promise.all([
          dRes.json(),
          aRes.json(),
          hRes.json(),
          rRes.json(),
          tRes.json(),
        ]);

        setDestination(dData.destination);
        setAttractions(aData.attractions || []);
        setHotels(hData.hotels || []);
        setRestaurants(rData.restaurants || []);
        setTransport(tData.transport || []);
        setTaxis(tData.taxis || []);

        // Initial nearby search around destination coordinates
        if (dData.destination) {
          fetchNearby(
            dData.destination.latitude,
            dData.destination.longitude,
            radiusKm
          );
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load destination travel catalog."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destId]);

  const fetchNearby = async (lat: number, lng: number, radius: number) => {
    setLoadingNearby(true);
    try {
      const res = await fetch(
        `/api/destinations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      if (res.ok) {
        const data = await res.json();
        setNearbyResults(data.attractions || []);
      }
    } catch (e) {
      console.error("Failed to query PostGIS nearby:", e);
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    if (destination) {
      fetchNearby(destination.latitude, destination.longitude, newRadius);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link href="/explore">
              <ArrowLeft className="w-4 h-4" /> Back to Destinations
            </Link>
          </Button>

          <DemoBadge />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading travel guide...</p>
          </div>
        ) : !destination ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground">Destination not found.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-card border shadow">
              <div className="h-64 sm:h-80 w-full relative bg-muted">
                {destination.hero_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={destination.hero_image}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Compass className="w-16 h-16 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur border-0">
                      {destination.state_province}, {destination.country}
                    </Badge>
                    <DemoBadge className="bg-amber-500/20 text-amber-300 border-amber-400/40" />
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                    {destination.name}
                  </h1>

                  <p className="text-sm sm:text-base text-gray-200 max-w-3xl mt-2 line-clamp-2">
                    {destination.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs sm:text-sm text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-400" />
                      Best Season: {destination.best_time_to_visit}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      {destination.latitude.toFixed(4)}°N, {destination.longitude.toFixed(4)}°E
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b pb-2">
              {[
                { id: "attractions", label: `Attractions (${attractions.length})`, icon: Compass },
                { id: "hotels", label: `Hotels (${hotels.length})`, icon: Building },
                { id: "restaurants", label: `Dining (${restaurants.length})`, icon: Utensils },
                { id: "transport", label: `Transport (${transport.length + taxis.length})`, icon: Car },
                { id: "nearby", label: "PostGIS Radius Search", icon: Radar },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Attractions */}
            {activeTab === "attractions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Key Sights & Attractions</h2>
                  <DemoBadge />
                </div>

                {attractions.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">No attractions recorded for this destination yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attractions.map((a) => (
                      <AttractionCard key={a.id} attraction={a} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Hotels */}
            {activeTab === "hotels" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Accommodations & Lodging</h2>
                  <DemoBadge />
                </div>

                {hotels.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">No accommodations seeded for this destination yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hotels.map((h) => (
                      <HotelCard key={h.id} hotel={h} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Restaurants */}
            {activeTab === "restaurants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Culinary & Dining Spots</h2>
                  <DemoBadge />
                </div>

                {restaurants.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">No restaurants seeded for this destination yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.map((r) => (
                      <RestaurantCard key={r.id} restaurant={r} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Transport */}
            {activeTab === "transport" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight">Intercity Transport Routes</h2>
                    <DemoBadge />
                  </div>

                  {transport.length === 0 ? (
                    <Card className="p-6 text-center border-dashed">
                      <p className="text-sm text-muted-foreground">No scheduled transit connections found.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transport.map((t) => (
                        <TransportCard key={t.id} transport={t} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight">Local Taxis & Car Rentals</h2>
                    <DemoBadge />
                  </div>

                  {taxis.length === 0 ? (
                    <Card className="p-6 text-center border-dashed">
                      <p className="text-sm text-muted-foreground">No local cab tariffs recorded.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {taxis.map((tx) => (
                        <TaxiCard key={tx.id} taxi={tx} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: PostGIS Nearby Discovery */}
            {activeTab === "nearby" && (
              <div className="space-y-6">
                <Card className="bg-card">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Radar className="w-5 h-5 text-primary" />
                          PostGIS Spatial Radius Query
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Calculates spherical great-circle distance from {destination.name}&apos;s center point ({destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}).
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">Search Radius:</span>
                        {[15, 25, 50, 100].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRadiusChange(r)}
                            className={`px-2.5 py-1 text-xs rounded-md border font-medium ${
                              radiusKm === r
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {r} km
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {loadingNearby ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : nearbyResults.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No attractions found within {radiusKm} km. Try increasing the search radius.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nearbyResults.map((item) => (
                      <Card key={item.id} className="p-4 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-primary">
                              {item.category}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {item.distance_km} km away
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-base">{item.name}</h4>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t mt-3">
                          <span className="flex items-center gap-1">
                            <NavIcon className="w-3 h-3 text-emerald-600" />
                            {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
                          </span>
                          <DemoBadge />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Demo Banner */}
            <Alert className="bg-muted/60 border text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-primary" />
              <AlertDescription>
                You are viewing DEMO travel data for {destination.name}. Coordinates, ticket prices, and opening hours are pre-seeded for testing the spatial and catalog engine.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>
    </div>
  );
}
