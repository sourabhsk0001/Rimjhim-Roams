"use client";

import { useEffect, useState } from "react";
import {
  User,
  Shield,
  Heart,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Globe,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TravelPace, BudgetTier } from "@/types/database";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Profile
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  // Traveller Profile
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Preferences
  const [pace, setPace] = useState<TravelPace>("moderate");
  const [budgetTier, setBudgetTier] = useState<BudgetTier>("moderate");
  const [dietary, setDietary] = useState("Vegetarian");
  const [interests, setInterests] = useState("Architecture, Nature, Local Markets");
  const [accommodation, setAccommodation] = useState("Boutique Hotel");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load profile.");
        }

        if (data.profile) {
          setEmail(data.profile.email || "");
          setFullName(data.profile.full_name || "");
        }
        if (data.traveller) {
          setNationality(data.traveller.nationality || "");
          setPhone(data.traveller.phone_number || "");
          setBio(data.traveller.bio || "");
          if (data.traveller.emergency_contact) {
            setEmergencyName(data.traveller.emergency_contact.name || "");
            setEmergencyPhone(data.traveller.emergency_contact.phone || "");
          }
        }
        if (data.preferences) {
          setPace(data.preferences.preferred_pace || "moderate");
          setBudgetTier(data.preferences.budget_tier || "moderate");
          setDietary((data.preferences.dietary_restrictions || []).join(", "));
          setInterests((data.preferences.interests || []).join(", "));
          setAccommodation(data.preferences.preferred_accommodation || "Hotel");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        profile: {
          full_name: fullName,
        },
        traveller: {
          nationality,
          phone_number: phone,
          bio,
          emergency_contact: {
            name: emergencyName,
            phone: emergencyPhone,
          },
        },
        preferences: {
          preferred_pace: pace,
          budget_tier: budgetTier,
          dietary_restrictions: dietary
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          interests: interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          preferred_accommodation: accommodation,
        },
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Traveller Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal traveler identity and AI itinerary calibration preferences.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Profile Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <CheckCircle className="w-4 h-4" />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>
              Your profile and preferences have been updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Account Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <User className="w-4 h-4" />
                  <span>Account Details</span>
                </div>
                <CardTitle className="text-xl">Basic Profile</CardTitle>
                <CardDescription>
                  Your primary authentication and account identifiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={email} disabled className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Traveller Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Traveller Identity</span>
                </div>
                <CardTitle className="text-xl">Traveller Information</CardTitle>
                <CardDescription>
                  Passport nationality, phone number, and emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality / Origin Country</Label>
                    <Input
                      id="nationality"
                      placeholder="e.g. India"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Traveller Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Short bio about your travel style and background..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="pt-2 border-t space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emName">Contact Name</Label>
                      <Input
                        id="emName"
                        placeholder="e.g. Next of Kin"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emPhone">Contact Phone</Label>
                      <Input
                        id="emPhone"
                        placeholder="+91 9876543211"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Travel Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Heart className="w-4 h-4" />
                  <span>Travel Preferences</span>
                </div>
                <CardTitle className="text-xl">AI Itinerary Calibration</CardTitle>
                <CardDescription>
                  Tune your default pacing, budget affinity, and interest clusters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefPace">Default Pacing</Label>
                    <select
                      id="prefPace"
                      value={pace}
                      onChange={(e) => setPace(e.target.value as TravelPace)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
                    >
                      <option value="relaxed">Relaxed (Slow Exploration)</option>
                      <option value="moderate">Moderate (Balanced)</option>
                      <option value="fast-paced">Fast-Paced (Comprehensive)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prefBudget">Budget Category Preference</Label>
                    <select
                      id="prefBudget"
                      value={budgetTier}
                      onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
                    >
                      <option value="budget">Backpacker / Budget</option>
                      <option value="moderate">Comfort / Moderate</option>
                      <option value="luxury">Premium / Luxury</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietary">Dietary Preferences / Restrictions</Label>
                  <Input
                    id="dietary"
                    placeholder="e.g. Vegetarian, Halal, Gluten-Free (comma-separated)"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Core Interests & Hobbies</Label>
                  <Input
                    id="interests"
                    placeholder="e.g. Architecture, Hiking, Museums, Nightlife, Coffee (comma-separated)"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accommodation">Preferred Accommodation Style</Label>
                  <Input
                    id="accommodation"
                    placeholder="e.g. Boutique Hotel, Airbnb Apartment, Hostel, Resort"
                    value={accommodation}
                    onChange={(e) => setAccommodation(e.target.value)}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving Changes..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
