export interface TripInputData {
  origin: string;
  destination?: string;
  start_date: string;
  end_date: string;
  duration_days?: number;
  budget: number | string;
  currency?: string;
  traveller_count: number | string;
  traveller_type?: "solo" | "couple" | "family" | "friends" | "business";
  travel_pace?: "relaxed" | "moderate" | "fast-paced";
  preferences?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: {
    origin: string;
    destination: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    budget: number;
    currency: string;
    traveller_count: number;
    traveller_type: "solo" | "couple" | "family" | "friends" | "business";
    travel_pace: "relaxed" | "moderate" | "fast-paced";
    preferences: Record<string, unknown>;
  };
}

export function validateTripInput(data: Partial<TripInputData>): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Origin validation
  const origin = (data.origin || "").trim();
  if (!origin) {
    errors.origin = "Origin location is required.";
  }

  // 2. Destination handling (If empty, save as 'destination discovery required')
  let destination = (data.destination || "").trim();
  if (!destination) {
    destination = "destination discovery required";
  }

  // 3. Dates validation
  const startDateStr = (data.start_date || "").trim();
  const endDateStr = (data.end_date || "").trim();

  if (!startDateStr) {
    errors.start_date = "Start date is required.";
  }
  if (!endDateStr) {
    errors.end_date = "End date is required.";
  }

  let durationDays = 1;
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime())) {
      errors.start_date = "Invalid start date format.";
    }
    if (isNaN(end.getTime())) {
      errors.end_date = "Invalid end date format.";
    }

    if (!errors.start_date && !errors.end_date) {
      if (start > end) {
        errors.end_date = "End date cannot be earlier than start date.";
      } else {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }
  }

  // 4. Budget validation
  const budgetNum = Number(data.budget);
  if (data.budget === undefined || data.budget === "" || isNaN(budgetNum) || budgetNum < 0) {
    errors.budget = "Budget must be a non-negative number.";
  }

  // 5. Traveller count validation
  const countNum = Number(data.traveller_count);
  if (data.traveller_count === undefined || data.traveller_count === "" || isNaN(countNum) || countNum < 1 || !Number.isInteger(countNum)) {
    errors.traveller_count = "Traveller count must be at least 1 person.";
  }

  // 6. Traveller type & pace defaults
  const validTypes = ["solo", "couple", "family", "friends", "business"] as const;
  const traveller_type = validTypes.includes(data.traveller_type as (typeof validTypes)[number])
    ? (data.traveller_type as (typeof validTypes)[number])
    : "solo";

  const validPaces = ["relaxed", "moderate", "fast-paced"] as const;
  const travel_pace = validPaces.includes(data.travel_pace as (typeof validPaces)[number])
    ? (data.travel_pace as (typeof validPaces)[number])
    : "moderate";

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    ...(valid
      ? {
          sanitized: {
            origin,
            destination,
            start_date: startDateStr,
            end_date: endDateStr,
            duration_days: data.duration_days && data.duration_days > 0 ? Number(data.duration_days) : durationDays,
            budget: budgetNum,
            currency: data.currency?.trim() || "USD",
            traveller_count: countNum,
            traveller_type,
            travel_pace,
            preferences: data.preferences || {},
          },
        }
      : {}),
  };
}
