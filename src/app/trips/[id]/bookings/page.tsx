"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  ArrowLeft,
  Plane,
  Train,
  Bus,
  Bed,
  Car,
  Ticket,
  Utensils,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  BadgeAlert,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { useToast } from "@/components/ui/toast";
import {
  TripBooking,
  BookingType,
  BookingStatus,
  BookingsSummary,
} from "@/types/travel-management";
import { formatCurrency } from "@/lib/budget/money";

const TYPE_ICONS: Record<BookingType, any> = {
  flight: Plane,
  train: Train,
  bus: Bus,
  hotel: Bed,
  taxi: Car,
  activity: Ticket,
  restaurant: Utensils,
};

const TYPE_LABELS: Record<BookingType, string> = {
  flight: "Flight",
  train: "Train",
  bus: "Bus",
  hotel: "Hotel / Lodging",
  taxi: "Cab / Taxi",
  activity: "Tour / Activity",
  restaurant: "Dining / Restaurant",
};

export default function TripBookingsPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<TripBooking[]>([]);
  const [summary, setSummary] = useState<BookingsSummary | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");

  // Add Booking Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [provider, setProvider] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>("flight");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [status, setStatus] = useState<BookingStatus>("pending_confirmation");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/trips/${tripId}/bookings`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load bookings");
      }

      setBookings(data.bookings || []);
      setSummary(data.summary || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error connecting to booking service.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchBookings();
    }
  }, [tripId, fetchBookings]);

  // Handle Add Booking
  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim() || !date) return;

    // Strict Invariant: Do not claim confirmation without actual provider confirmation.
    if (status === "confirmed" && !bookingReference.trim()) {
      alert("Confirmation reference (PNR / Confirmation ID) is required to mark a booking as Confirmed.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.trim(),
          booking_reference: bookingReference.trim() || undefined,
          type: bookingType,
          date,
          time: time.trim() || undefined,
          price: parseFloat(price) || 0,
          currency,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setShowAddModal(false);
      setProvider("");
      setBookingReference("");
      setPrice("");
      setNotes("");
      setTime("");
      setStatus("pending_confirmation");
      fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to remove this booking record?")) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete booking");
      }
      fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting booking");
    }
  };

  const filteredBookings =
    activeTypeFilter === "all"
      ? bookings
      : bookings.filter((b) => b.type === activeTypeFilter);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6 animate-fade-rise">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(215,25%,32%)] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trip Details
          </Link>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs sm:text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> Add Booking Record
          </button>
        </div>

        {/* Unified Module Nav */}
        <TripWorkspaceNav tripId={tripId} />

        {/* Verification Invariant Banner */}
        <Alert className="bg-indigo-50/60 border-indigo-200 text-indigo-950">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <AlertTitle className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            Source-Verified Booking Management
          </AlertTitle>
          <AlertDescription className="text-xs text-indigo-800 leading-relaxed mt-0.5">
            TripWise tracks real travel reservations with zero fabricated statuses. Bookings only display
            the <strong>Verified Confirmed</strong> badge when an authentic provider booking reference or PNR
            has been registered.
          </AlertDescription>
        </Alert>

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
              Loading your verified booking reservations...
            </p>
          </div>
        ) : (
          <>
            {/* Summary Statistics Card */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs text-[hsl(215,25%,32%)] font-medium uppercase tracking-wider">Total Bookings</span>
                    <p className="font-instrument text-3xl font-normal text-[#0f172a]">
                      {summary.totalCount}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs text-emerald-800 font-medium uppercase tracking-wider">Verified Confirmed</span>
                    <p className="font-instrument text-3xl font-normal text-emerald-800">
                      {summary.confirmedCount}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs text-amber-800 font-medium uppercase tracking-wider">Pending Confirmation</span>
                    <p className="font-instrument text-3xl font-normal text-amber-800">
                      {summary.pendingCount}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs text-[hsl(215,25%,32%)] font-medium uppercase tracking-wider">Committed Spend</span>
                    <p className="font-instrument text-3xl font-normal text-[#0f172a]">
                      {summary.totalCostFormatted}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
              {["all", "flight", "train", "bus", "hotel", "taxi", "activity", "restaurant"].map(
                (type) => {
                  const count =
                    type === "all"
                      ? bookings.length
                      : bookings.filter((b) => b.type === type).length;

                  return (
                    <button
                      key={type}
                      onClick={() => setActiveTypeFilter(type)}
                      className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                        activeTypeFilter === type
                          ? "bg-blue-600 text-white shadow-xs font-semibold"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {type === "all" ? "All Bookings" : TYPE_LABELS[type as BookingType]} ({count})
                    </button>
                  );
                }
              )}
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center space-y-3">
                  <div className="p-3 rounded-full bg-slate-100 w-fit mx-auto text-slate-500">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    No booking records registered yet.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Keep your transport tickets, hotel reservations, cab bookings, and restaurant
                    tables organized in one place.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Booking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBookings.map((b) => {
                  const Icon = TYPE_ICONS[b.type] || CalendarCheck;

                  return (
                    <Card key={b.id} className="border shadow-xs hover:border-slate-300 transition">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {b.type}
                          </Badge>

                          {b.status === "confirmed" ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed
                            </Badge>
                          ) : b.status === "cancelled" ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] gap-1">
                              <Clock className="w-3 h-3" /> Pending Confirmation
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-base font-bold mt-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                            {b.provider}
                          </span>
                          <span className="font-mono text-sm text-foreground">
                            {formatCurrency(b.price, { currency: b.currency })}
                          </span>
                        </CardTitle>

                        {b.booking_reference ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded w-fit mt-1 border">
                            <span className="text-muted-foreground text-[10px]">REF / PNR:</span>
                            <span className="font-bold">{b.booking_reference}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 italic block mt-1">
                            No provider reference entered
                          </span>
                        )}
                      </CardHeader>

                      <CardContent className="text-xs text-muted-foreground pb-3 space-y-2">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span>Date: {b.date}</span>
                          {b.time && <span>Time: {b.time}</span>}
                        </div>

                        {b.notes && (
                          <p className="text-xs text-slate-700 bg-slate-50/50 p-2 rounded border">
                            {b.notes}
                          </p>
                        )}

                        {b.document_name && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-700">
                            <FileText className="w-3.5 h-3.5" />
                            <Link href={`/trips/${tripId}/documents`} className="hover:underline">
                              Attached Voucher: {b.document_name}
                            </Link>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-0 justify-end border-t pt-2 bg-slate-50/40">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBooking(b.id)}
                          className="text-slate-400 hover:text-red-600 p-2 h-7 text-xs gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Add Booking Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600" /> Add Booking Record
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bookingType" className="text-xs">
                      Booking Type *
                    </Label>
                    <select
                      id="bookingType"
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value as BookingType)}
                      className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                    >
                      <option value="flight">Flight</option>
                      <option value="train">Train</option>
                      <option value="bus">Bus</option>
                      <option value="hotel">Hotel / Lodging</option>
                      <option value="taxi">Cab / Taxi</option>
                      <option value="activity">Tour / Activity</option>
                      <option value="restaurant">Dining / Restaurant</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-xs">
                      Booking Status *
                    </Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as BookingStatus)}
                      className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                    >
                      <option value="pending_confirmation">Pending Confirmation</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="waitlisted">Waitlisted</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider" className="text-xs">
                    Provider Name *
                  </Label>
                  <Input
                    id="provider"
                    placeholder="e.g. IndiGo, IRCTC, Taj Hotels, MakeMyTrip, Uber"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reference" className="text-xs">
                    Booking Reference / PNR
                  </Label>
                  <Input
                    id="reference"
                    placeholder="e.g. 6E-2849, PNR: 2849281729, HTL-8823"
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    Required if marking status as &quot;Confirmed&quot;.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-xs">
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time" className="text-xs">
                      Time (Optional)
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="price" className="text-xs">
                      Price / Fare
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-xs">
                      Currency
                    </Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-1 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs">
                    Notes / Seat Details
                  </Label>
                  <Input
                    id="notes"
                    placeholder="e.g. Seat 14B, Terminal 2, Breakfast included"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                    {submitting ? "Saving..." : "Save Booking"}
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
