"use client";

import { useState } from "react";
import {
  Sparkles,
  Check,
  Compass,
  X,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { PillButton } from "@/components/ui/pill-button";
import { NATMOTourismTheme } from "@/types/recommendations";
import { IndiaZone } from "@/types/india-tourism";
import { TravelPace, BudgetTier, TravellerType } from "@/types/database";

interface OnboardingPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
  isModal?: boolean;
}

const ALL_NATMO_THEMES: Array<{
  id: NATMOTourismTheme;
  title: string;
  icon: string;
  description: string;
}> = [
  {
    id: "Royal Forts & Palaces",
    title: "Royal Forts & Palaces",
    icon: "🏰",
    description: "Rajput citadels, Mughal marble palaces, and living fortresses",
  },
  {
    id: "Coastal Beaches & Marine",
    title: "Coastal Beaches & Marine",
    icon: "🏖️",
    description: "Goan coves, Malabar backwaters, and coral atolls",
  },
  {
    id: "Spiritual & Pilgrimage",
    title: "Spiritual & Pilgrimage",
    icon: "🛕",
    description: "Vedic riverfront ghats, Jyotirlingas, and Buddhist circuits",
  },
  {
    id: "Wildlife & Tiger Reserves",
    title: "Wildlife & Tiger Reserves",
    icon: "🐅",
    description: "Royal Bengal tigers, Asiatic lions, and rhino safaris",
  },
  {
    id: "Himalayan Valleys & Monasteries",
    title: "Himalayan Valleys",
    icon: "🏔️",
    description: "Alpine passes, Tibetan gompas, and high-altitude lakes",
  },
  {
    id: "Tea Gardens & Hill Stations",
    title: "Tea Estates & Hills",
    icon: "🍃",
    description: "Munnar, Darjeeling, and Nilgiri mist-clad plantations",
  },
  {
    id: "Waterfalls & Eco-Tourism",
    title: "Waterfalls & Eco-Wonders",
    icon: "🌊",
    description: "Living root bridges, Chitrakote falls, and monsoon trails",
  },
  {
    id: "Ancient Caves & Rock Architecture",
    title: "Ancient Rock Caves",
    icon: "🗿",
    description: "Ajanta, Ellora, and monolithic Vijayanagara UNESCO stone carvings",
  },
  {
    id: "Cultural Heritage & Food Corridors",
    title: "Culture & Cuisine",
    icon: "🍛",
    description: "Awadhi culinary trails, French quarters, and handicraft bazaars",
  },
  {
    id: "Desert Safari & Dunes",
    title: "Desert Dunes & Safari",
    icon: "🐪",
    description: "Thar camel safaris, Rann salt white deserts, and starlit camps",
  },
];

const ALL_ZONES: Array<{ id: IndiaZone; label: string; states: string }> = [
  { id: "North", label: "North India", states: "Delhi, Rajasthan, UP, Himachal, Kashmir" },
  { id: "South", label: "South India", states: "Kerala, Karnataka, Tamil Nadu, Andhra" },
  { id: "West", label: "West India", states: "Goa, Maharashtra, Gujarat" },
  { id: "East", label: "East India", states: "West Bengal, Bihar, Odisha, Jharkhand" },
  { id: "Central", label: "Central India", states: "Madhya Pradesh, Chhattisgarh" },
  { id: "North-East", label: "North-East India", states: "Assam, Meghalaya, Arunachal, Sikkim" },
  { id: "Islands", label: "Islands", states: "Andaman & Nicobar, Lakshadweep" },
];

export function OnboardingPanel({
  isOpen = true,
  onClose,
  onSaved,
  isModal = true,
}: OnboardingPanelProps) {
  const [selectedThemes, setSelectedThemes] = useState<NATMOTourismTheme[]>([
    "Royal Forts & Palaces",
    "Coastal Beaches & Marine",
  ]);
  const [selectedZones, setSelectedZones] = useState<IndiaZone[]>(["North", "West", "South"]);
  const [pace, setPace] = useState<TravelPace>("moderate");
  const [budgetTier, setBudgetTier] = useState<BudgetTier>("moderate");
  const [companion, setCompanion] = useState<TravellerType>("couple");
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTheme = (theme: NATMOTourismTheme) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const toggleZone = (zone: IndiaZone) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/recommendations/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_themes: selectedThemes,
          preferred_zones: selectedZones,
          preferred_pace: pace,
          budget_tier: budgetTier,
          companion_type: companion,
        }),
      });

      if (res.ok) {
        if (onSaved) onSaved();
        if (onClose) onClose();
      }
    } catch (e) {
      console.error("Failed to save onboarding preferences", e);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Travel Intelligence · Step {step} of 3</span>
          </div>
          <h2 className="font-instrument text-3xl font-normal text-slate-900 leading-tight">
            Personalize Your Travel Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-light">
            We tune your recommendation engine using authoritative NATMO tourism circuits and
            GeoNames regional hierarchy.
          </p>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Step Indicator Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
        <button
          onClick={() => setStep(1)}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            step === 1 ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          1. Tourism Themes ({selectedThemes.length})
        </button>
        <button
          onClick={() => setStep(2)}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            step === 2 ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          2. Travel Style & Budget
        </button>
        <button
          onClick={() => setStep(3)}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            step === 3 ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          3. Indian Zones ({selectedZones.length})
        </button>
      </div>

      {/* STEP 1: NATMO Tourism Themes */}
      {step === 1 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Select what excites you most (select 2 or more)</span>
            <span className="font-medium text-slate-900">
              {selectedThemes.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {ALL_NATMO_THEMES.map((theme) => {
              const active = selectedThemes.includes(theme.id);
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  className={`text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{theme.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-xs sm:text-sm truncate">
                        {theme.title}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                    </div>
                    <p
                      className={`text-[11px] line-clamp-1 mt-0.5 font-light ${
                        active ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Travel Pace, Budget & Companion */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Travel Pace */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Travel Pace
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "relaxed", label: "Relaxed", desc: "1-2 sites/day, slow lingering" },
                { id: "moderate", label: "Moderate", desc: "2-3 sites/day, balanced rhythm" },
                { id: "fast-paced", label: "Fast-Paced", desc: "4+ sites/day, cover everything" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPace(p.id as TravelPace)}
                  className={`p-3 rounded-2xl border text-center transition ${
                    pace === p.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Tier */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              Budget Tier
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "budget", label: "Budget Explorer", desc: "Hostels, trains, street food" },
                { id: "moderate", label: "Comfort / Mid", desc: "3-4★ hotels, AC taxis, cafes" },
                { id: "luxury", label: "Heritage / Luxury", desc: "Palaces, private guides, fine dining" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudgetTier(b.id as BudgetTier)}
                  className={`p-3 rounded-2xl border text-center transition ${
                    budgetTier === b.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{b.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Companion Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Who are you travelling with?
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: "solo", label: "Solo" },
                { id: "couple", label: "Couple" },
                { id: "friends", label: "Friends" },
                { id: "family", label: "Family" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompanion(c.id as TravellerType)}
                  className={`p-2.5 rounded-2xl border text-center font-medium transition ${
                    companion === c.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Geographic Zones */}
      {step === 3 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-xs text-slate-600">
            Pick geographic regions of India you want prioritized:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {ALL_ZONES.map((zone) => {
              const active = selectedZones.includes(zone.id);
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => toggleZone(zone.id)}
                  className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{zone.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 truncate ${
                        active ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {zone.states}
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-4"
            >
              Skip for now
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <PillButton
              variant="small"
              onClick={() => setStep((s) => s + 1)}
              className="bg-black text-white hover:bg-slate-800"
            >
              Next Step
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </PillButton>
          ) : (
            <PillButton
              variant="small"
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white hover:bg-slate-800"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                  Save & Personalize
                </>
              )}
            </PillButton>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
      {content}
    </div>
  );
}
