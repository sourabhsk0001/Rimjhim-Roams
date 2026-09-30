// ==============================================================================
// Phase 14: Deterministic Travel Packing Engine
// Generates intelligent, adaptive packing checklists using:
//   - Destination & Climate
//   - Duration (Days)
//   - Real-time / Forecast Weather & Temperature
//   - Scheduled & Preferred Activities
//   - Traveller Type (Solo, Couple, Family, Friends, Business)
// Categories:
//   - Clothing
//   - Documents
//   - Toiletries
//   - Electronics
//   - Weather
//   - Activity-specific
// ==============================================================================

import {
  PackingCategory,
  PackingItem,
  GeneratePackingInput,
  PackingListSummary,
  PackingCategorySummary,
} from "@/types/travel-management";

export class PackingEngine {
  /**
   * Generates a comprehensive, category-sorted packing list deterministically.
   */
  generatePackingList(tripId: string, input: GeneratePackingInput): PackingItem[] {
    const items: PackingItem[] = [];
    const destination = (input.destination || "Destination").trim();
    const duration = Math.max(1, Math.min(60, input.duration || 3));
    const travellerType = (input.travellerType || "solo").toLowerCase();
    const travellerCount = Math.max(1, input.travellerCount || 1);
    const activities = (input.activities || []).map((a) => a.toLowerCase());
    const weather = input.weather || {};
    const temp = weather.temperature;
    const rainProb = weather.rainProbability || 0;
    const condition = (weather.condition || "").toLowerCase();
    const climate = (weather.climate || "").toLowerCase();

    let counter = 1;
    const createItem = (
      category: PackingCategory,
      itemName: string,
      quantity: number = 1,
      essential: boolean = false,
      notes?: string
    ): PackingItem => ({
      id: `pack-${tripId}-${category.toLowerCase().replace(/[^a-z]/g, "")}-${counter++}`,
      trip_id: tripId,
      category,
      item_name: itemName,
      quantity,
      packed: false,
      is_custom: false,
      essential,
      notes,
    });

    // ---------------------------------------------------------------------------
    // 1. CLOTHING (Scaled by duration and traveller type)
    // ---------------------------------------------------------------------------
    const topsQty = Math.min(duration + 1, 8);
    const bottomsQty = Math.max(2, Math.ceil(duration / 2));
    const undergarmentsQty = duration + 2;
    const socksQty = duration + 1;
    const sleepwearQty = Math.max(2, Math.ceil(duration / 3));

    items.push(
      createItem("Clothing", "Comfortable Tops / T-Shirts / Shirts", topsQty, true),
      createItem("Clothing", "Pants / Jeans / Breathable Trousers", bottomsQty, true),
      createItem("Clothing", "Undergarments", undergarmentsQty, true),
      createItem("Clothing", "Pairs of Socks", socksQty, true),
      createItem("Clothing", "Comfortable Sleepwear / Nightwear", sleepwearQty),
      createItem("Clothing", "Comfortable Walking Shoes / Sneakers", 1, true)
    );

    if (travellerType === "business") {
      items.push(
        createItem("Clothing", "Formal Suits / Blazers", 2, true, "Dry-cleaned for meetings"),
        createItem("Clothing", "Ironed Formal Shirts / Blouses", Math.min(duration, 5), true),
        createItem("Clothing", "Formal Dress Shoes & Belt", 1, true)
      );
    } else if (travellerType === "family") {
      items.push(
        createItem("Clothing", "Extra Children Clothing Changes", Math.min(duration * 2, 8), true),
        createItem("Clothing", "Slip-resistant Kids Shoes", 1)
      );
    }

    if (activities.some((a) => a.includes("nightlife") || a.includes("club") || a.includes("fine dining"))) {
      items.push(createItem("Clothing", "Smart Evening / Dinner Outfits", 2));
    }

    // ---------------------------------------------------------------------------
    // 2. DOCUMENTS (Essential regulatory and transport passes)
    // ---------------------------------------------------------------------------
    items.push(
      createItem(
        "Documents",
        "Government Photo ID (Passport / Aadhaar / Driver's License)",
        1,
        true,
        "Mandatory for flights, hotels, and checkposts"
      ),
      createItem(
        "Documents",
        "Transport Tickets & Boarding Passes (Flight / Train / Bus)",
        1,
        true,
        "Keep digital and printed backup copies"
      ),
      createItem(
        "Documents",
        "Hotel & Accommodation Confirmation Slips",
        1,
        true,
        "Printed counterfoil or verified digital voucher"
      ),
      createItem(
        "Documents",
        "Travel Health & Medical Insurance Policy Card",
        1,
        true,
        "Includes cashless emergency network contact"
      ),
      createItem(
        "Documents",
        "Emergency Contacts & Prescriptions List",
        1,
        true,
        "Physical card with blood group and emergency numbers"
      )
    );

    const isHighAltitudeOrBorder =
      destination.toLowerCase().includes("manali") ||
      destination.toLowerCase().includes("darjeeling") ||
      destination.toLowerCase().includes("sikkim") ||
      destination.toLowerCase().includes("ladakh");

    if (isHighAltitudeOrBorder) {
      items.push(
        createItem(
          "Documents",
          "Protected Area Permit (PAP) / NGT Vehicle Permit Documents",
          1,
          true,
          "Printed copies with passport photos for border checkposts"
        )
      );
    }

    // ---------------------------------------------------------------------------
    // 3. TOILETRIES (Hygiene, personal care, and medical essentials)
    // ---------------------------------------------------------------------------
    items.push(
      createItem("Toiletries", "Travel-size Toothbrush & Toothpaste", 1, true),
      createItem("Toiletries", "Shampoo, Conditioner & Body Wash", 1),
      createItem("Toiletries", "Deodorant / Fragrance", 1),
      createItem("Toiletries", "Hydrating Face & Body Moisturizer", 1),
      createItem("Toiletries", "Nourishing Lip Balm with SPF", 1),
      createItem("Toiletries", "Quick-Dry Microfiber Travel Towel", 1),
      createItem(
        "Toiletries",
        "Personal Medications & Mini First-Aid Kit",
        1,
        true,
        "Pain relief, band-aids, antiseptics, and personal prescriptions"
      ),
      createItem("Toiletries", "Hand Sanitizer & Disinfecting Wipes", 2, true)
    );

    if (travellerType === "family") {
      items.push(createItem("Toiletries", "Baby Wet Wipes & Child Care Essentials", 2, true));
    }

    // ---------------------------------------------------------------------------
    // 4. ELECTRONICS (Power, navigation, and connectivity)
    // ---------------------------------------------------------------------------
    items.push(
      createItem("Electronics", "Smartphone & Heavy-duty Charging Cable", 1, true),
      createItem(
        "Electronics",
        "High-Capacity Power Bank (10,000 - 20,000 mAh)",
        1,
        true,
        "Essential for full-day GPS navigation and photography"
      ),
      createItem("Electronics", "Multi-Plug Universal Power Adapter", 1, true),
      createItem("Electronics", "Noise-Canceling Earphones / Headphones", 1),
      createItem("Electronics", "Cable Organizer Pouch", 1)
    );

    if (travellerType === "business") {
      items.push(
        createItem("Electronics", "Laptop, Charger & HDMI Display Cable", 1, true),
        createItem("Electronics", "Wireless Travel Mouse & Flash Drive", 1)
      );
    }

    if (activities.some((a) => a.includes("sightseeing") || a.includes("nature") || a.includes("photography"))) {
      items.push(createItem("Electronics", "Camera, Extra Batteries & Memory Cards", 1));
    }

    // ---------------------------------------------------------------------------
    // 5. WEATHER-SPECIFIC (Tailored to temperature, rain, and climate)
    // ---------------------------------------------------------------------------
    const isCold =
      (temp !== undefined && temp < 18) ||
      climate.includes("alpine") ||
      condition.includes("snow") ||
      isHighAltitudeOrBorder;

    const isRainy =
      rainProb > 25 ||
      condition.includes("rain") ||
      condition.includes("drizzle") ||
      condition.includes("thunder");

    const isWarmOrHot =
      (temp !== undefined && temp >= 24) ||
      climate.includes("tropical") ||
      climate.includes("semi-arid") ||
      destination.toLowerCase().includes("goa") ||
      destination.toLowerCase().includes("jaipur");

    if (isCold) {
      items.push(
        createItem("Weather", "Thermal Innerwear (Tops & Bottoms)", 2, true, "Base layer for sub-15°C cold"),
        createItem("Weather", "Heavy Fleece / Down Winter Jacket", 1, true, "Insulated outer layer"),
        createItem("Weather", "Woolen Socks & Thermal Beanie", 2, true),
        createItem("Weather", "Insulated Warm Gloves & Scarf", 1, true),
        createItem("Weather", "Intensive Cold Cream & Lip Butter", 1)
      );
    }

    if (isRainy) {
      items.push(
        createItem("Weather", "Waterproof Rain Jacket / Poncho", 1, true, "Packable protection against downpours"),
        createItem("Weather", "Wind-Resistant Compact Travel Umbrella", 1, true),
        createItem("Weather", "Waterproof Phone Pouch & Dry Pouch", 1, true),
        createItem("Weather", "Silica Gel Desiccant Packs for Luggage", 4),
        createItem("Weather", "Quick-Drying Synthetic Extra Clothing", 2)
      );
    }

    if (isWarmOrHot || (!isCold && !isRainy)) {
      items.push(
        createItem("Weather", "UV400 Polarized Sunglasses", 1, true),
        createItem("Weather", "High-SPF Broad Spectrum Sunscreen (SPF 50+)", 1, true),
        createItem("Weather", "Wide-Brim Sun Hat / Breathable Cap", 1),
        createItem("Weather", "Oral Rehydration Salts (ORS) / Electrolyte Sachets", 4, true),
        createItem("Weather", "Mosquito & Insect Repellent Spray / Roll-on", 1, true),
        createItem("Weather", "Aloe Vera Soothing Gel for Sun Care", 1)
      );
    }

    // ---------------------------------------------------------------------------
    // 6. ACTIVITY-SPECIFIC (Tailored to scheduled tour activities)
    // ---------------------------------------------------------------------------
    const hasBeach =
      activities.some((a) => a.includes("beach") || a.includes("sea") || a.includes("coastal")) ||
      destination.toLowerCase().includes("goa");

    const hasTrek =
      activities.some((a) => a.includes("trek") || a.includes("hike") || a.includes("mountain") || a.includes("valley")) ||
      destination.toLowerCase().includes("manali") ||
      destination.toLowerCase().includes("darjeeling");

    const hasTemplesOrHeritage =
      activities.some((a) => a.includes("temple") || a.includes("ghat") || a.includes("fort") || a.includes("monument") || a.includes("heritage")) ||
      destination.toLowerCase().includes("varanasi") ||
      destination.toLowerCase().includes("jaipur") ||
      destination.toLowerCase().includes("agra") ||
      destination.toLowerCase().includes("udaipur");

    if (hasBeach) {
      items.push(
        createItem("Activity-specific", "UV Rash Guard & Quick-Dry Swimwear", 2, true, "Beach & water sports"),
        createItem("Activity-specific", "Sand-Resistant Microfiber Beach Towel", 1),
        createItem("Activity-specific", "Waterproof Dry Bag (10L - 20L)", 1, true, "Protects electronics on boats"),
        createItem("Activity-specific", "Grip Water Shoes / Beach Flip-Flops", 1, true),
        createItem("Activity-specific", "Reef-Safe Water-Resistant Sunscreen", 1)
      );
    }

    if (hasTrek) {
      items.push(
        createItem("Activity-specific", "Sturdy Ankle-Support Hiking Boots", 1, true, "Broken-in boots for trails"),
        createItem("Activity-specific", "Moisture-Wicking Anti-Blister Trekking Socks", 3, true),
        createItem("Activity-specific", "Telescopic Lightweight Trekking Pole", 1),
        createItem("Activity-specific", "1.5L Sturdy Refillable Hydration Bottle", 1, true),
        createItem("Activity-specific", "High-Protein Trail Mix & Energy Bars", 4),
        createItem("Activity-specific", "Blister Relief Plasters & Knee Support Brace", 1),
        createItem("Activity-specific", "Compact 20L Daypack with Rain Cover", 1, true)
      );
    }

    if (hasTemplesOrHeritage) {
      items.push(
        createItem(
          "Activity-specific",
          "Modest Attire Covering Shoulders & Knees",
          2,
          true,
          "Statutory temple & monument etiquette requirement"
        ),
        createItem(
          "Activity-specific",
          "Lightweight Cotton Scarf / Shawl for Head Covering",
          1,
          false,
          "Required at sacred sanctums"
        ),
        createItem(
          "Activity-specific",
          "Easy Slip-on Footwear",
          1,
          true,
          "Convenient for frequent shoe deposit kiosks"
        ),
        createItem(
          "Activity-specific",
          "Thick Cotton Socks for Sun-Heated Courtyard Walking",
          2,
          false,
          "Protects feet on hot stone temple tiles"
        )
      );
    }

    return items;
  }

  /**
   * Summarizes a list of packing items with progress and category breakdowns.
   */
  summarizePackingList(
    tripId: string,
    items: PackingItem[],
    factors: GeneratePackingInput
  ): PackingListSummary {
    const totalItems = items.length;
    const packedItems = items.filter((i) => i.packed).length;
    const percentage = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

    const categoriesOrder: PackingCategory[] = [
      "Clothing",
      "Documents",
      "Toiletries",
      "Electronics",
      "Weather",
      "Activity-specific",
    ];

    const categories: PackingCategorySummary[] = categoriesOrder.map((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      return {
        category: cat,
        total: catItems.length,
        packed: catItems.filter((i) => i.packed).length,
        items: catItems,
      };
    });

    return {
      tripId,
      totalItems,
      packedItems,
      percentage,
      categories,
      factorsUsed: {
        destination: factors.destination,
        duration: factors.duration,
        weatherCondition: factors.weather?.condition,
        temperature: factors.weather?.temperature,
        activitiesCount: (factors.activities || []).length,
        travellerType: factors.travellerType || "solo",
      },
    };
  }
}

export const packingEngine = new PackingEngine();
