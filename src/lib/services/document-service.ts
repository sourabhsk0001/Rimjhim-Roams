// ==============================================================================
// Phase 14: Document Service (Supabase Private Storage + Signed URLs)
// Access control:
//   - Members (owner, editor, viewer) can view and generate signed URLs
//   - Editors and owners can upload and delete documents
//   - Non-members are strictly unauthorized
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { collaborationService } from "@/lib/services/collaboration-service";
import {
  TripDocument,
  TravelDocumentType,
  UploadDocumentInput,
} from "@/types/travel-management";

export const memoryDocuments: Map<string, TripDocument> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export class DocumentService {
  private readonly BUCKET_NAME = "travel-documents";

  /**
   * Lists all documents for an authorized trip with signed URLs attached.
   */
  async listTripDocuments(
    tripId: string,
    userId: string,
    expiresInSeconds: number = 3600
  ): Promise<{
    authorized: boolean;
    documents?: TripDocument[];
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role) {
      return {
        authorized: false,
        error: "Unauthorized: You do not have permission to view documents for this trip.",
      };
    }

    let docs: TripDocument[] = [];

    if (!isSupabaseLive()) {
      docs = Array.from(memoryDocuments.values()).filter((d) => d.trip_id === tripId);
    } else {
      try {
        const supabase = createServerSupabase() as any;
        const { data, error } = await supabase
          .from("trip_documents")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", { ascending: false });

        if (error) {
          return { authorized: true, error: error.message };
        }
        docs = (data as TripDocument[]) || [];
      } catch (err: unknown) {
        return { authorized: true, error: err instanceof Error ? err.message : "Error loading documents." };
      }
    }

    // Attach freshly generated signed URLs for secure access
    const docsWithSignedUrls = await Promise.all(
      docs.map(async (doc) => {
        const signedUrlRes = await this.generateSignedUrl(doc.file_path, expiresInSeconds);
        return {
          ...doc,
          signed_url: signedUrlRes.url,
          signed_url_expires_at: signedUrlRes.expiresAt,
        };
      })
    );

    return {
      authorized: true,
      documents: docsWithSignedUrls,
    };
  }

  /**
   * Generates a signed URL for a specific document.
   */
  async getDocumentSignedUrl(
    tripId: string,
    documentId: string,
    userId: string,
    expiresInSeconds: number = 3600
  ): Promise<{
    authorized: boolean;
    signedUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role) {
      return {
        authorized: false,
        error: "Unauthorized: You do not have permission to access documents for this trip.",
      };
    }

    let doc: TripDocument | undefined;

    if (!isSupabaseLive()) {
      doc = memoryDocuments.get(documentId);
    } else {
      try {
        const supabase = createServerSupabase() as any;
        const { data } = await supabase
          .from("trip_documents")
          .select("*")
          .eq("id", documentId)
          .eq("trip_id", tripId)
          .maybeSingle();

        doc = data as TripDocument;
      } catch {
        // Fallback
      }
    }

    if (!doc || doc.trip_id !== tripId) {
      return { authorized: true, error: "Document not found." };
    }

    const signedUrlRes = await this.generateSignedUrl(doc.file_path, expiresInSeconds);
    return {
      authorized: true,
      signedUrl: signedUrlRes.url,
      expiresAt: signedUrlRes.expiresAt,
    };
  }

  /**
   * Saves document metadata record after uploading to private storage.
   * Only owner and editor can create document records.
   */
  async createDocumentRecord(
    tripId: string,
    userId: string,
    input: UploadDocumentInput
  ): Promise<{
    authorized: boolean;
    document?: TripDocument;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return {
        authorized: false,
        error: "Unauthorized: Viewers cannot upload travel documents.",
      };
    }

    const now = new Date().toISOString();
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: TripDocument = {
      id: docId,
      trip_id: tripId,
      uploaded_by: userId,
      name: input.name.trim(),
      document_type: input.document_type,
      file_path: input.file_path,
      file_size: input.file_size || 0,
      mime_type: input.mime_type || "application/octet-stream",
      notes: input.notes?.trim(),
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseLive()) {
      memoryDocuments.set(newDoc.id, newDoc);
      const signedRes = await this.generateSignedUrl(newDoc.file_path, 3600);
      return {
        authorized: true,
        document: {
          ...newDoc,
          signed_url: signedRes.url,
          signed_url_expires_at: signedRes.expiresAt,
        },
      };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_documents")
        .insert({
          trip_id: tripId,
          uploaded_by: userId,
          name: newDoc.name,
          document_type: newDoc.document_type,
          file_path: newDoc.file_path,
          file_size: newDoc.file_size,
          mime_type: newDoc.mime_type,
          notes: newDoc.notes,
        })
        .select()
        .single();

      if (error) {
        return { authorized: true, error: error.message };
      }

      const signedRes = await this.generateSignedUrl(newDoc.file_path, 3600);
      return {
        authorized: true,
        document: {
          ...(data as TripDocument),
          signed_url: signedRes.url,
          signed_url_expires_at: signedRes.expiresAt,
        },
      };
    } catch (err: unknown) {
      return { authorized: true, error: err instanceof Error ? err.message : "Error creating document." };
    }
  }

  /**
   * Deletes a document and its storage object.
   * Only owner and editor can delete documents.
   */
  async deleteDocument(
    tripId: string,
    documentId: string,
    userId: string
  ): Promise<{
    authorized: boolean;
    success: boolean;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return {
        authorized: false,
        success: false,
        error: "Unauthorized: Viewers cannot delete travel documents.",
      };
    }

    if (!isSupabaseLive()) {
      const existing = memoryDocuments.get(documentId);
      if (existing && existing.trip_id === tripId) {
        memoryDocuments.delete(documentId);
      }
      return { authorized: true, success: true };
    }

    try {
      const supabase = createServerSupabase() as any;

      // 1. Get file path
      const { data: doc } = await supabase
        .from("trip_documents")
        .select("file_path")
        .eq("id", documentId)
        .eq("trip_id", tripId)
        .maybeSingle();

      if (doc?.file_path) {
        // Delete from private storage
        await supabase.storage.from(this.BUCKET_NAME).remove([doc.file_path]);
      }

      // 2. Delete database record
      const { error } = await supabase
        .from("trip_documents")
        .delete()
        .eq("id", documentId)
        .eq("trip_id", tripId);

      if (error) {
        return { authorized: true, success: false, error: error.message };
      }

      return { authorized: true, success: true };
    } catch (err: unknown) {
      return { authorized: true, success: false, error: err instanceof Error ? err.message : "Error deleting document." };
    }
  }

  // ---------------------------------------------------------------------------
  // Internal Signed URL Generator
  // ---------------------------------------------------------------------------
  private async generateSignedUrl(
    filePath: string,
    expiresInSeconds: number
  ): Promise<{ url: string; expiresAt: string }> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    if (!isSupabaseLive()) {
      const mockToken = `sig-${Math.random().toString(36).substring(2, 10)}`;
      return {
        url: `https://storage.tripwise.internal/signed/${this.BUCKET_NAME}/${filePath}?token=${mockToken}&expires=${encodeURIComponent(expiresAt)}`,
        expiresAt,
      };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        return {
          url: `https://storage.tripwise.internal/fallback/${filePath}`,
          expiresAt,
        };
      }

      return {
        url: data.signedUrl,
        expiresAt,
      };
    } catch {
      return {
        url: `https://storage.tripwise.internal/fallback/${filePath}`,
        expiresAt,
      };
    }
  }
}

export const documentService = new DocumentService();
