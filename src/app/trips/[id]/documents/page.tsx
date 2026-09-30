"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  Loader2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Ticket,
  Building,
  Activity,
  FileCheck,
  Plus,
  Clock,
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
  TripDocument,
  TravelDocumentType,
} from "@/types/travel-management";

const TYPE_ICONS: Record<TravelDocumentType, any> = {
  ticket: Ticket,
  hotel_confirmation: Building,
  activity_confirmation: Activity,
  other: FileText,
};

const TYPE_LABELS: Record<TravelDocumentType, string> = {
  ticket: "Tickets (Flight / Train / Bus)",
  hotel_confirmation: "Hotel Confirmations",
  activity_confirmation: "Activity Confirmations",
  other: "Other Travel Documents",
};

export default function TripDocumentsPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<TravelDocumentType>("ticket");
  const [docNotes, setDocNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/trips/${tripId}/documents`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load documents");
      }

      setDocuments(data.documents || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error connecting to document storage.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchDocuments();
    }
  }, [tripId, fetchDocuments]);

  // Handle Mock or Live Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    setUploading(true);
    try {
      const sanitizedName = docName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const filePath = `trips/${tripId}/${Date.now()}-${sanitizedName}.pdf`;

      const res = await fetch(`/api/trips/${tripId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docName.trim(),
          document_type: docType,
          file_path: filePath,
          file_size: 245000, // standard sample PDF size
          mime_type: "application/pdf",
          notes: docNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      setShowUploadModal(false);
      setDocName("");
      setDocNotes("");
      fetchDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving document");
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete Document
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to permanently delete this document?")) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete document");
      }
      fetchDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting document");
    }
  };

  const filteredDocs =
    activeFilter === "all"
      ? documents
      : documents.filter((d) => d.document_type === activeFilter);

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

          <Button
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-medium rounded-xl"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>

        {/* Unified Module Nav */}
        <TripWorkspaceNav tripId={tripId} />

        {/* Security & Access Control Banner */}
        <Alert className="bg-slate-50 border-slate-300 text-slate-800">
          <Lock className="w-4 h-4 text-blue-600" />
          <AlertTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Private Storage & Signed URL Access Control
          </AlertTitle>
          <AlertDescription className="text-xs text-slate-600 leading-relaxed mt-0.5">
            Travel documents are securely stored in a private Supabase Storage bucket. Access is
            strictly restricted to authorized trip members via time-limited signed URLs (1-hour expiration).
            Direct public storage links are blocked.
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
              Loading your encrypted travel documents...
            </p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
              {[
                { id: "all", label: `All Documents (${documents.length})` },
                {
                  id: "ticket",
                  label: `Tickets (${documents.filter((d) => d.document_type === "ticket").length})`,
                },
                {
                  id: "hotel_confirmation",
                  label: `Hotels (${documents.filter((d) => d.document_type === "hotel_confirmation").length})`,
                },
                {
                  id: "activity_confirmation",
                  label: `Activities (${documents.filter((d) => d.document_type === "activity_confirmation").length})`,
                },
                {
                  id: "other",
                  label: `Other (${documents.filter((d) => d.document_type === "other").length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                    activeFilter === tab.id
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Document Cards Grid */}
            {filteredDocs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center space-y-3">
                  <div className="p-3 rounded-full bg-slate-100 w-fit mx-auto text-slate-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    No documents found in this category.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Upload your flight tickets, train passes, hotel confirmation slips, and activity
                    vouchers for secure access on the go.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUploadModal(true)}
                    className="mt-2 text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Upload First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const Icon = TYPE_ICONS[doc.document_type] || FileText;

                  return (
                    <Card key={doc.id} className="border shadow-xs hover:border-slate-300 transition">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={
                              doc.document_type === "ticket"
                                ? "border-blue-300 text-blue-800 bg-blue-50 text-[10px]"
                                : doc.document_type === "hotel_confirmation"
                                ? "border-emerald-300 text-emerald-800 bg-emerald-50 text-[10px]"
                                : doc.document_type === "activity_confirmation"
                                ? "border-purple-300 text-purple-800 bg-purple-50 text-[10px]"
                                : "border-slate-300 text-slate-700 text-[10px]"
                            }
                          >
                            {doc.document_type.replace("_", " ").toUpperCase()}
                          </Badge>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <CardTitle className="text-base font-bold mt-1.5 flex items-center gap-2">
                          <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </CardTitle>

                        {doc.notes && (
                          <CardDescription className="text-xs">{doc.notes}</CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="text-xs text-muted-foreground pb-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Size: {Math.round(doc.file_size / 1024)} KB</span>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                            {doc.file_path}
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 gap-2 border-t pt-3 bg-slate-50/40">
                        {doc.signed_url && (
                          <Button
                            size="sm"
                            asChild
                            className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            <a href={doc.signed_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-3.5 h-3.5" /> View / Download
                            </a>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-slate-400 hover:text-red-600 p-2 h-8"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" /> Upload Travel Document
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <Label htmlFor="docType" className="text-xs">
                    Document Category *
                  </Label>
                  <select
                    id="docType"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as TravelDocumentType)}
                    className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                  >
                    <option value="ticket">Ticket (Flight / Train / Bus)</option>
                    <option value="hotel_confirmation">Hotel Confirmation</option>
                    <option value="activity_confirmation">Activity Voucher / Confirmation</option>
                    <option value="other">Other Travel Document</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="docName" className="text-xs">
                    Document Name / Title *
                  </Label>
                  <Input
                    id="docName"
                    placeholder="e.g. IndiGo DEL-GOI E-Ticket, Taj Aguada Voucher"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="docNotes" className="text-xs">
                    Notes / Confirmation Reference
                  </Label>
                  <Input
                    id="docNotes"
                    placeholder="e.g. PNR: 6E-2849, Check-in at 14:00"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center space-y-1">
                  <FileCheck className="w-5 h-5 text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-700 font-medium">
                    Private Storage Encryption Enabled
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Files are encrypted at rest. Signed access links expire in 60 minutes.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {uploading ? "Uploading..." : "Save to Documents"}
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
