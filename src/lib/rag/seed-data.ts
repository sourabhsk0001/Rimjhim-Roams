import { IngestDocumentInput } from "@/types/rag";

export const AUTHORITATIVE_KNOWLEDGE_DOCS: IngestDocumentInput[] = [
  {
    title: "Goa Beach Safety & Southwest Monsoon Swimming Regulations",
    source: "Goa Tourism Development Corporation & Drishti Marine Lifesaving",
    destination: "Goa",
    category: "safety",
    published_at: "2024-05-15T00:00:00Z",
    content: `Swimming in the Arabian Sea is strictly prohibited along all Goa beaches during the Southwest Monsoon period, spanning from June 1 to September 30 annually. Severe rip currents, underwater sinkholes, and towering surf make sea entry hazardous even for trained swimmers.

Lifesavers station red warning flags across all 40 monitored coastal stretches from Morjim to Palolem. A red flag signifies a complete water closure. Entering the sea when red flags are raised is a punishable offense under the Goa Tourist Places (Protection and Maintenance) Act.

Water sports, including parasailing, jet skiing, and boat cruises, remain suspended throughout the monsoon season until clearance is granted in October by the Captain of Ports. For sea distress emergencies, contact the Drishti Lifesaving Beach Rescue Helpline at 0832-2419100 or dial 112.`,
    metadata: {
      officialAct: "Goa Tourist Places (Protection and Maintenance) Act",
      emergencyContact: "0832-2419100 / 112",
      season: "Southwest Monsoon",
      appliesTo: "All coastal beaches in North and South Goa",
    },
  },
  {
    title: "Protected Area Permits (PAP) and Restricted Area Permits (RAP) for Sikkim",
    source: "Ministry of Home Affairs & Sikkim Tourism and Civil Aviation Department",
    destination: "Sikkim",
    category: "permits",
    published_at: "2024-03-10T00:00:00Z",
    content: `Access to border and sensitive ecological zones in Sikkim is governed by the Foreigners (Protected Areas) Order and State Security Directives.

1. Restricted Area Permit (RAP): All foreign nationals require a Restricted Area Permit to enter Sikkim (Gangtok, Pelling, Ravangla, Namchi). RAP is issued free of charge for 30 days by the Ministry of Home Affairs, Indian Missions abroad, and designated border checkposts at Rangpo and Melli.

2. Protected Area Permit (PAP): Mandatory for both domestic Indian tourists and foreign nationals travelling to high-altitude border zones:
   - North Sikkim: Lachung, Lachen, Yumthang Valley, Chopta Valley, and Gurudongmar Lake. (Foreign nationals are permitted up to Chopta Valley / Yumthang but cannot visit Gurudongmar Lake).
   - East Sikkim: Tsomgo Lake, Baba Mandir, and Nathula Pass. (Nathula Pass is restricted exclusively to Indian citizens).

Permit Application Requirements: PAP must be processed at least 24 to 48 hours in advance through an authorized Sikkim Tourism registered tour operator. Required documentation includes 2 passport-size photographs and government-issued photo ID (Voter ID, Passport, or Aadhaar for Indian nationals; Passport and valid Indian visa for foreign tourists).`,
    metadata: {
      jurisdiction: "Ministry of Home Affairs / Government of Sikkim",
      advanceNoticeRequiredHours: 48,
      restrictedZones: ["Gurudongmar Lake", "Nathula Pass", "Yumthang Valley"],
    },
  },
  {
    title: "Authorized Prepaid Taxi Operations and Fare Regulation in Jaipur & Goa",
    source: "State Transport Authority & Tourist Police Unit",
    destination: "All India",
    category: "transit",
    published_at: "2024-01-20T00:00:00Z",
    content: `To protect visitors from fare gouging, tout extortion, and unauthorized transport middlemen, government-regulated prepaid taxi counters operate at all major transit terminals:

- Jaipur: Official Government Prepaid Taxi booths are stationed outside Jaipur International Airport (JAI) and Jaipur Junction Railway Station (Exit Gate 1). Passengers must pay the tariff calculated by destination zone at the counter and retain the passenger slip. Do not hand over the driver counterfoil until safely arriving at your hotel.
- Goa: Use the authorized GoaMiles app or physical prepaid taxi counters located inside Dabolim Airport (GOI) and Manohar International Airport (Mopa / GOX). Goa law prohibits non-metered street hailing of tourist taxis without an authorized digital booking or prepaid receipt.

Report taxi overcharging, meter refusal, or aggressive touting to the Tourist Police Booth or WhatsApp Tourist Helpline at +91 70690 12345. Always photograph the taxi's registration plate (yellow number plate) before loading luggage.`,
    metadata: {
      compliance: "Prepaid Passenger Counterfoil Protocol",
      helpline: "+91 70690 12345",
      destinations: ["Jaipur", "Goa"],
    },
  },
  {
    title: "Heritage Conservation Guidelines and Sacred Temple Etiquette in Rajasthan",
    source: "Archaeological Survey of India & Department of Archaeology and Museums, Rajasthan",
    destination: "Jaipur",
    category: "cultural_norms",
    published_at: "2024-02-01T00:00:00Z",
    content: `Visitors exploring ASI Centrally Protected Monuments (Amber Fort, Jantar Mantar, Hawa Mahal) and active places of worship must observe statutory conservation rules:

1. Dress Standards: Modest attire covering shoulders and knees is expected at active temples (such as Govind Dev Ji Temple and Birla Mandir) and traditional sanctums. Footwear, leather belts, and tobacco products must be deposited at the shoe kiosk before passing the temple threshold.
2. Photography Regulations: Tripods, commercial filmmaking, and drones are strictly prohibited within monument perimeters without written advance clearance from the ASI Director General. Flash photography is banned in preservation chambers containing 17th-century frescoes and mirrored glasswork (Sheesh Mahal).
3. Authorized Guides: Engage only Ministry of Tourism licensed regional guides who carry a photographic badge and fee schedule card. Do not accept unregulated guide offers from shop touts or auto drivers.`,
    metadata: {
      governingBody: "Archaeological Survey of India (ASI)",
      photographyRules: "No unauthorized drones, tripods, or flash",
    },
  },
  {
    title: "Acute Mountain Sickness (AMS) and High Altitude Protocols for Manali & Rohtang",
    source: "Indian Mountaineering Foundation & Himachal Pradesh Health Services",
    destination: "Manali",
    category: "health",
    published_at: "2024-04-10T00:00:00Z",
    content: `Ascending rapidly from low plains to high altitude destinations around Manali (2,050m), Atal Tunnel (3,060m), and Rohtang Pass (3,978m) carries immediate risk of Acute Mountain Sickness (AMS).

1. Mandatory Acclimatization: Spend at least 24 to 48 hours resting in Manali town before undertaking high-altitude day excursions across Rohtang Pass or the high valleys of Lahaul.
2. Symptoms Recognition: Watch for early symptoms of AMS: persistent throbbing headache, dizziness, nausea, fatigue, and shortness of breath during mild exertion.
3. Crucial Emergency Rule: The golden rule of high-altitude safety is: 'Never ascend with symptoms of AMS.' If symptoms worsen, descend immediately by at least 500 to 1,000 meters. Do not rely solely on pain relief medication to mask symptoms.
4. Hydration & Prevention: Drink 3 to 4 liters of water daily. Avoid alcoholic beverages and sedatives during ascent. Oxygen cylinders are available for rent at registered tourist equipment centers in Manali for high-altitude passes.`,
    metadata: {
      elevationWarningMeters: 2500,
      protocol: "Mandatory 24-48h acclimatization, immediate descent on symptom progression",
    },
  },
  {
    title: "National Tourist Helpline 1363 and Consumer Protection Standards",
    source: "Ministry of Tourism, Government of India & National Consumer Helpline",
    destination: "All India",
    category: "legal",
    published_at: "2024-01-01T00:00:00Z",
    content: `The Ministry of Tourism operates the 24x7 Multi-Lingual Tourist Helpline available via toll-free short code 1363 (or 1800-11-1363). The helpline provides immediate safety assistance, grievance redressal, and travel information in 12 languages, including English, Hindi, French, German, Spanish, and Japanese.

Emergency Protocol for Travelers:
- Dial 112 for integrated police, medical, and fire rescue across all Indian states and Union Territories.
- In case of hotel booking fraud, unauthorized tour operator cancellations, or inflated tariff disputes, register an online complaint with the National Consumer Helpline at consumerhelpline.gov.in or SMS 'CONSUMER' to 8800001915.
- Retain all transaction receipts, digital booking confirmations, and GST invoices for travel services to ensure statutory consumer protection.`,
    metadata: {
      helpline: "1363 / 1800-11-1363",
      emergencyDial: "112",
      portal: "consumerhelpline.gov.in",
    },
  },
];
