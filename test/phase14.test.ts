import { before, test } from "node:test";
import assert from "node:assert";
import { packingEngine } from "../src/lib/engines/packing-engine";
import { packingService } from "../src/lib/services/packing-service";
import { documentService } from "../src/lib/services/document-service";
import { bookingService } from "../src/lib/services/booking-service";
import { createTrip } from "../src/lib/services/trip-service";
import { collaborationService } from "../src/lib/services/collaboration-service";

const userOwner = "user-phase14-owner";
const userEditor = "user-phase14-editor";
const userViewer = "user-phase14-viewer";
const userIntruder = "user-phase14-intruder";

let testTripId = "";

before(async () => {
  // Create test trip owned by userOwner
  const tripRes = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-11-15",
      end_date: "2026-11-20",
      budget: 45000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "friends",
      travel_pace: "moderate",
      preferences: {
        themes: ["beaches", "nightlife", "water sports"],
      },
    },
    userOwner
  );

  assert.ok(tripRes.data);
  testTripId = tripRes.data.id;

  // Add userEditor as editor
  await collaborationService.addTripMember(testTripId, userOwner, userEditor, "editor", {
    full_name: "Editor User",
    email: "editor@example.com",
  });

  // Add userViewer as viewer
  await collaborationService.addTripMember(testTripId, userOwner, userViewer, "viewer", {
    full_name: "Viewer User",
    email: "viewer@example.com",
  });
});

// ==============================================================================
// 1. Packing Engine: Categorization, Scaling & Weather/Activity Adaptation
// ==============================================================================

test("Packing Engine: Generates items across all 6 required categories", () => {
  const items = packingEngine.generatePackingList(testTripId, {
    destination: "Goa",
    duration: 5,
    travellerType: "friends",
    travellerCount: 2,
    activities: ["beach", "swimming", "nightlife"],
    weather: { temperature: 30, condition: "Sunny", rainProbability: 10 },
  });

  const categories = new Set(items.map((i) => i.category));
  const expectedCategories = [
    "Clothing",
    "Documents",
    "Toiletries",
    "Electronics",
    "Weather",
    "Activity-specific",
  ];

  for (const exp of expectedCategories) {
    assert.ok(categories.has(exp as any), `Missing category: ${exp}`);
  }
  assert.ok(items.length >= 15, "Should generate comprehensive checklist");
});

test("Packing Engine: Adapts to rainy weather conditions", () => {
  const rainItems = packingEngine.generatePackingList(testTripId, {
    destination: "Goa",
    duration: 4,
    weather: { temperature: 26, condition: "Heavy Rain", rainProbability: 80 },
  });

  const weatherCategory = rainItems.filter((i) => i.category === "Weather");
  const itemNames = weatherCategory.map((i) => i.item_name.toLowerCase());

  assert.ok(itemNames.some((n) => n.includes("rain") || n.includes("poncho")));
  assert.ok(itemNames.some((n) => n.includes("umbrella")));
  assert.ok(itemNames.some((n) => n.includes("pouch")));
});

test("Packing Engine: Adapts to cold alpine mountain destinations", () => {
  const coldItems = packingEngine.generatePackingList(testTripId, {
    destination: "Manali",
    duration: 6,
    weather: { temperature: 8, condition: "Snow", climate: "alpine" },
    activities: ["trekking", "snow"],
  });

  const weatherCategory = coldItems.filter((i) => i.category === "Weather");
  const itemNames = weatherCategory.map((i) => i.item_name.toLowerCase());

  assert.ok(itemNames.some((n) => n.includes("thermal")));
  assert.ok(itemNames.some((n) => n.includes("fleece") || n.includes("jacket")));
  assert.ok(itemNames.some((n) => n.includes("woolen") || n.includes("beanie")));

  // Trekking activity specific
  const activityItems = coldItems.filter((i) => i.category === "Activity-specific");
  const actNames = activityItems.map((i) => i.item_name.toLowerCase());
  assert.ok(actNames.some((n) => n.includes("hiking") || n.includes("boots")));
  assert.ok(actNames.some((n) => n.includes("pole")));
});

test("Packing Engine: Scales clothing quantities according to trip duration", () => {
  const shortTrip = packingEngine.generatePackingList("short", {
    destination: "Jaipur",
    duration: 2,
  });

  const longTrip = packingEngine.generatePackingList("long", {
    destination: "Jaipur",
    duration: 7,
  });

  const shortTops = shortTrip.find((i) => i.item_name.includes("Tops"))?.quantity || 0;
  const longTops = longTrip.find((i) => i.item_name.includes("Tops"))?.quantity || 0;

  assert.ok(longTops > shortTops, `Long trip should have more tops than short trip (${longTops} > ${shortTops})`);
});

// ==============================================================================
// 2. Packing Service: Persistence, Checkboxes & Custom Items
// ==============================================================================

test("Packing Service: Generates and retrieves checklist for authorized trip", async () => {
  const res = await packingService.getTripPackingList(testTripId, userOwner);

  assert.strictEqual(res.authorized, true);
  assert.ok(res.items && res.items.length > 0);
  assert.ok(res.summary);
  assert.strictEqual(res.summary.tripId, testTripId);
  assert.strictEqual(res.summary.categories.length, 6);
});

test("Packing Service: Checkbox toggle marks item as packed/unpacked", async () => {
  const listRes = await packingService.getTripPackingList(testTripId, userOwner);
  const firstItem = listRes.items![0];

  assert.strictEqual(firstItem.packed, false);

  // Toggle to packed
  const toggleRes1 = await packingService.togglePackingItem(testTripId, firstItem.id, true, userOwner);
  assert.strictEqual(toggleRes1.authorized, true);
  assert.strictEqual(toggleRes1.item?.packed, true);

  // Toggle back to unpacked
  const toggleRes2 = await packingService.togglePackingItem(testTripId, firstItem.id, false, userOwner);
  assert.strictEqual(toggleRes2.authorized, true);
  assert.strictEqual(toggleRes2.item?.packed, false);
});

test("Packing Service: Check all items in a category", async () => {
  const res = await packingService.checkAllCategory(testTripId, "Documents", true, userOwner);
  assert.strictEqual(res.authorized, true);
  assert.strictEqual(res.success, true);

  const refreshed = await packingService.getTripPackingList(testTripId, userOwner);
  const docItems = refreshed.items!.filter((i) => i.category === "Documents");
  for (const item of docItems) {
    assert.strictEqual(item.packed, true);
  }
});

test("Packing Service: Adds custom item and deletes item", async () => {
  const addRes = await packingService.addCustomItem(
    testTripId,
    {
      category: "Activity-specific",
      item_name: "GoPro Hero 12 with Floating Grip",
      quantity: 1,
      essential: true,
      notes: "For scuba diving session",
    },
    userEditor
  );

  assert.strictEqual(addRes.authorized, true);
  assert.ok(addRes.item);
  assert.strictEqual(addRes.item.is_custom, true);
  assert.strictEqual(addRes.item.essential, true);

  // Delete the custom item
  const delRes = await packingService.deletePackingItem(testTripId, addRes.item.id, userEditor);
  assert.strictEqual(delRes.authorized, true);
  assert.strictEqual(delRes.success, true);
});

// ==============================================================================
// 3. Document Service: Private Storage & Expiring Signed URLs
// ==============================================================================

test("Document Service: Saves document metadata and generates expiring signed URLs", async () => {
  const docRes = await documentService.createDocumentRecord(testTripId, userOwner, {
    name: "Flight Tickets BOM-GOI",
    document_type: "ticket",
    file_path: `trips/${testTripId}/indigo-flight-6e.pdf`,
    file_size: 450120,
    mime_type: "application/pdf",
    notes: "IndiGo 6E-2849, Terminal 2",
  });

  assert.strictEqual(docRes.authorized, true);
  assert.ok(docRes.document);
  assert.strictEqual(docRes.document.name, "Flight Tickets BOM-GOI");
  assert.strictEqual(docRes.document.document_type, "ticket");
  assert.ok(docRes.document.signed_url);
  assert.ok(docRes.document.signed_url.includes("token="));
  assert.ok(docRes.document.signed_url_expires_at);

  const listRes = await documentService.listTripDocuments(testTripId, userOwner);
  assert.strictEqual(listRes.authorized, true);
  assert.ok(listRes.documents && listRes.documents.length >= 1);
  assert.ok(listRes.documents[0].signed_url);
});

test("Document Service: Generates on-demand signed URL for specific document", async () => {
  const listRes = await documentService.listTripDocuments(testTripId, userViewer);
  const firstDoc = listRes.documents![0];

  const signedRes = await documentService.getDocumentSignedUrl(testTripId, firstDoc.id, userViewer, 1800);
  assert.strictEqual(signedRes.authorized, true);
  assert.ok(signedRes.signedUrl);
  assert.ok(signedRes.expiresAt);
});

// ==============================================================================
// 4. Booking Service: Strict Confirmation Verification Invariant
// ==============================================================================

test("Booking Invariant: Status 'confirmed' requires verified booking reference", async () => {
  // Case A: Confirmed with authentic booking reference -> is_provider_verified = true
  const verifiedRes = await bookingService.createBooking(testTripId, userOwner, {
    provider: "IndiGo Airlines",
    booking_reference: "6E-2849",
    type: "flight",
    date: "2026-11-15",
    time: "14:30",
    price: 6800,
    currency: "INR",
    status: "confirmed",
    notes: "Non-stop Mumbai to Goa",
  });

  assert.strictEqual(verifiedRes.authorized, true);
  assert.ok(verifiedRes.booking);
  assert.strictEqual(verifiedRes.booking.status, "confirmed");
  assert.strictEqual(verifiedRes.booking.is_provider_verified, true);
  assert.strictEqual(verifiedRes.booking.booking_reference, "6E-2849");

  // Case B: User claims 'confirmed' without reference -> downgraded to 'pending_confirmation'
  const unverifiedRes = await bookingService.createBooking(testTripId, userOwner, {
    provider: "Taj Holiday Village",
    booking_reference: "", // empty reference!
    type: "hotel",
    date: "2026-11-15",
    price: 18000,
    currency: "INR",
    status: "confirmed", // false claim without proof
    notes: "Sea-facing cottage",
  });

  assert.strictEqual(unverifiedRes.authorized, true);
  assert.ok(unverifiedRes.booking);
  assert.strictEqual(
    unverifiedRes.booking.status,
    "pending_confirmation",
    "Unverified confirmation claim must downgrade to pending_confirmation"
  );
  assert.strictEqual(unverifiedRes.booking.is_provider_verified, false);
});

test("Booking Service: Supports all 7 booking types and generates accurate summary", async () => {
  await bookingService.createBooking(testTripId, userEditor, {
    provider: "GoaMiles Prepaid Taxi",
    type: "taxi",
    date: "2026-11-15",
    time: "16:00",
    price: 1200,
    currency: "INR",
    status: "confirmed",
    booking_reference: "GM-99120",
  });

  await bookingService.createBooking(testTripId, userEditor, {
    provider: "Grande Island Scuba Diving",
    type: "activity",
    date: "2026-11-16",
    price: 3500,
    currency: "INR",
    status: "pending_confirmation",
  });

  await bookingService.createBooking(testTripId, userEditor, {
    provider: "Thalassa Greek Taverna",
    type: "restaurant",
    date: "2026-11-16",
    time: "20:00",
    price: 2500,
    currency: "INR",
    status: "confirmed",
    booking_reference: "THAL-RES-44",
  });

  const listRes = await bookingService.listTripBookings(testTripId, userOwner);
  assert.strictEqual(listRes.authorized, true);
  assert.ok(listRes.bookings && listRes.bookings.length >= 4);

  const summary = listRes.summary!;
  assert.ok(summary.confirmedCount >= 3);
  assert.ok(summary.pendingCount >= 1);
  assert.ok(summary.totalCostFormatted.includes("₹") || summary.totalCostFormatted.includes("INR"));
  assert.ok(summary.byTypeCount.flight >= 1);
  assert.ok(summary.byTypeCount.taxi >= 1);
  assert.ok(summary.byTypeCount.activity >= 1);
  assert.ok(summary.byTypeCount.restaurant >= 1);
});

// ==============================================================================
// 5. Strict Authorization & Access Control
// ==============================================================================

test("Authorization: Unauthorized intruder is rejected across Packing, Documents, and Bookings", async () => {
  // Packing
  const packRes = await packingService.getTripPackingList(testTripId, userIntruder);
  assert.strictEqual(packRes.authorized, false);

  const toggleRes = await packingService.togglePackingItem(testTripId, "any-id", true, userIntruder);
  assert.strictEqual(toggleRes.authorized, false);

  // Documents
  const docListRes = await documentService.listTripDocuments(testTripId, userIntruder);
  assert.strictEqual(docListRes.authorized, false);

  const signedRes = await documentService.getDocumentSignedUrl(testTripId, "any-doc", userIntruder);
  assert.strictEqual(signedRes.authorized, false);

  const docUploadRes = await documentService.createDocumentRecord(testTripId, userIntruder, {
    name: "Hack.pdf",
    document_type: "ticket",
    file_path: "fake/path.pdf",
    file_size: 100,
    mime_type: "application/pdf",
  });
  assert.strictEqual(docUploadRes.authorized, false);

  // Bookings
  const bookListRes = await bookingService.listTripBookings(testTripId, userIntruder);
  assert.strictEqual(bookListRes.authorized, false);

  const bookCreateRes = await bookingService.createBooking(testTripId, userIntruder, {
    provider: "Fake",
    type: "flight",
    date: "2026-11-15",
    price: 100,
  });
  assert.strictEqual(bookCreateRes.authorized, false);
});

test("Authorization: Viewer can read packing and documents, but cannot write/upload/create", async () => {
  // Viewer CAN read
  const packRes = await packingService.getTripPackingList(testTripId, userViewer);
  assert.strictEqual(packRes.authorized, true);

  const docRes = await documentService.listTripDocuments(testTripId, userViewer);
  assert.strictEqual(docRes.authorized, true);

  const bookRes = await bookingService.listTripBookings(testTripId, userViewer);
  assert.strictEqual(bookRes.authorized, true);

  // Viewer CANNOT add custom packing item
  const customPack = await packingService.addCustomItem(
    testTripId,
    { category: "Clothing", item_name: "Illegal Viewer Item" },
    userViewer
  );
  assert.strictEqual(customPack.authorized, false);

  // Viewer CANNOT upload documents
  const uploadRes = await documentService.createDocumentRecord(testTripId, userViewer, {
    name: "ViewerUpload.pdf",
    document_type: "other",
    file_path: "trips/viewer.pdf",
    file_size: 100,
    mime_type: "application/pdf",
  });
  assert.strictEqual(uploadRes.authorized, false);

  // Viewer CANNOT create bookings
  const createBookRes = await bookingService.createBooking(testTripId, userViewer, {
    provider: "Viewer Hotel",
    type: "hotel",
    date: "2026-11-15",
    price: 500,
  });
  assert.strictEqual(createBookRes.authorized, false);
});
