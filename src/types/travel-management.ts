// ==============================================================================
// Phase 14: Travel Management Layer Domain Models
// Packing Lists, Supabase Storage Documents, and Booking Records
// ==============================================================================

// -----------------------------------------------------------------------------
// 1. Packing Types
// -----------------------------------------------------------------------------
export type PackingCategory =
  | "Clothing"
  | "Documents"
  | "Toiletries"
  | "Electronics"
  | "Weather"
  | "Activity-specific";

export interface PackingItem {
  id: string;
  trip_id: string;
  category: PackingCategory;
  item_name: string;
  quantity: number;
  packed: boolean;
  is_custom: boolean;
  essential: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratePackingInput {
  destination: string;
  duration: number;
  weather?: {
    temperature?: number;
    condition?: string;
    rainProbability?: number;
    climate?: string;
  };
  activities?: string[];
  travellerType?: string;
  travellerCount?: number;
}

export interface PackingCategorySummary {
  category: PackingCategory;
  total: number;
  packed: number;
  items: PackingItem[];
}

export interface PackingListSummary {
  tripId: string;
  totalItems: number;
  packedItems: number;
  percentage: number;
  categories: PackingCategorySummary[];
  factorsUsed: {
    destination: string;
    duration: number;
    weatherCondition?: string;
    temperature?: number;
    activitiesCount: number;
    travellerType: string;
  };
}

// -----------------------------------------------------------------------------
// 2. Document Types (Supabase Private Storage + Signed URLs)
// -----------------------------------------------------------------------------
export type TravelDocumentType =
  | "ticket"
  | "hotel_confirmation"
  | "activity_confirmation"
  | "other";

export interface TripDocument {
  id: string;
  trip_id: string;
  uploaded_by: string;
  name: string;
  document_type: TravelDocumentType;
  file_path: string;
  file_size: number;
  mime_type: string;
  notes?: string;
  signed_url?: string;
  signed_url_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentInput {
  name: string;
  document_type: TravelDocumentType;
  file_path: string;
  file_size: number;
  mime_type: string;
  notes?: string;
}

// -----------------------------------------------------------------------------
// 3. Booking Types
// -----------------------------------------------------------------------------
export type BookingType =
  | "flight"
  | "train"
  | "bus"
  | "hotel"
  | "taxi"
  | "activity"
  | "restaurant";

export type BookingStatus =
  | "confirmed"
  | "pending_confirmation"
  | "cancelled"
  | "waitlisted";

export interface TripBooking {
  id: string;
  trip_id: string;
  created_by: string;
  provider: string;
  booking_reference?: string;
  type: BookingType;
  date: string;
  time?: string;
  price: number;
  currency: string;
  status: BookingStatus;
  notes?: string;
  document_id?: string;
  document_name?: string;
  is_provider_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  provider: string;
  booking_reference?: string;
  type: BookingType;
  date: string;
  time?: string;
  price: number;
  currency?: string;
  status?: BookingStatus;
  notes?: string;
  document_id?: string;
}

export interface BookingsSummary {
  tripId: string;
  totalCount: number;
  confirmedCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalCostFormatted: string;
  byTypeCount: Record<BookingType, number>;
}
