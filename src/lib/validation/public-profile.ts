// ==============================================================================
// Public Profile Validation & Sanitization Module
// Guarantees data accepted into public profile tables meets strict clean formats
// and prevents HTML/XSS injection, invalid usernames, and malformed inputs.
// ==============================================================================

export const ALLOWED_TRAVEL_STYLES = [
  "backpacker",
  "cultural",
  "luxury",
  "adventure",
  "photographer",
  "slow_travel",
  "road_tripper",
  "balanced",
] as const;

export type TravelStyle = typeof ALLOWED_TRAVEL_STYLES[number];

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "api",
  "auth",
  "login",
  "register",
  "signup",
  "trips",
  "assistant",
  "settings",
  "profile",
  "profiles",
  "explore",
  "support",
  "help",
  "null",
  "undefined",
  "tripwise",
  "rimjhim",
]);

export interface PublicProfileInput {
  username: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  home_city?: string | null;
  travel_style?: TravelStyle;
  visited_states_count?: number;
  badges?: string[];
  top_destinations?: string[];
  is_public?: boolean;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Checks if a string contains HTML tags or angle brackets '<' and '>'.
 */
function containsHtmlOrTags(val: string): boolean {
  return /[<>]/.test(val) || /<\/?[a-z][\s\S]*>/i.test(val);
}

/**
 * Strips HTML tags and removes dangerous angle brackets.
 */
function stripHtmlTags(val: string): string {
  return val.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
}

/**
 * Validates public profile inputs against clean-format constraints.
 * Rejects dirty strings (XSS, spaces in username, invalid ranges, etc.) with detailed error messages.
 */
export function validatePublicProfileInput(input: unknown): ValidationResult<PublicProfileInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object."] };
  }

  const raw = input as Record<string, unknown>;

  // 1. Username Validation
  if (typeof raw.username !== "string") {
    errors.push("Username is required and must be a string.");
  } else {
    const username = raw.username.trim();
    if (username.length < 3 || username.length > 30) {
      errors.push("Username must be between 3 and 30 characters long.");
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      errors.push("Username must only contain lowercase alphanumeric characters, hyphens, and underscores (no spaces, uppercase letters, or special symbols).");
    }
    if (RESERVED_USERNAMES.has(username.toLowerCase())) {
      errors.push(`Username '${username}' is reserved by the system.`);
    }
  }

  // 2. Display Name Validation
  if (typeof raw.display_name !== "string") {
    errors.push("Display name is required and must be a string.");
  } else {
    const displayName = raw.display_name.trim();
    if (displayName.length < 2 || displayName.length > 50) {
      errors.push("Display name must be between 2 and 50 characters long.");
    }
    if (containsHtmlOrTags(displayName)) {
      errors.push("Display name contains invalid characters or HTML tags (< or >).");
    }
  }

  // 3. Bio Validation
  let cleanBio: string | null = null;
  if (raw.bio !== undefined && raw.bio !== null) {
    if (typeof raw.bio !== "string") {
      errors.push("Bio must be a string if provided.");
    } else {
      cleanBio = raw.bio.trim();
      if (cleanBio.length > 300) {
        errors.push("Bio must not exceed 300 characters.");
      }
      if (containsHtmlOrTags(cleanBio)) {
        errors.push("Bio contains invalid characters or HTML tags (< or >).");
      }
    }
  }

  // 4. Travel Style Validation
  let cleanTravelStyle: TravelStyle = "balanced";
  if (raw.travel_style !== undefined && raw.travel_style !== null) {
    if (typeof raw.travel_style !== "string") {
      errors.push("Travel style must be a string.");
    } else if (!ALLOWED_TRAVEL_STYLES.includes(raw.travel_style as TravelStyle)) {
      errors.push(
        `Invalid travel style '${raw.travel_style}'. Must be one of: ${ALLOWED_TRAVEL_STYLES.join(", ")}.`
      );
    } else {
      cleanTravelStyle = raw.travel_style as TravelStyle;
    }
  }

  // 5. Visited States Count Validation
  let cleanStatesCount = 0;
  if (raw.visited_states_count !== undefined && raw.visited_states_count !== null) {
    if (
      typeof raw.visited_states_count !== "number" ||
      !Number.isInteger(raw.visited_states_count) ||
      raw.visited_states_count < 0 ||
      raw.visited_states_count > 36
    ) {
      errors.push("Visited states count must be an integer between 0 and 36.");
    } else {
      cleanStatesCount = raw.visited_states_count;
    }
  }

  // 6. Home City Validation
  let cleanHomeCity: string | null = null;
  if (raw.home_city !== undefined && raw.home_city !== null) {
    if (typeof raw.home_city !== "string") {
      errors.push("Home city must be a string if provided.");
    } else {
      cleanHomeCity = raw.home_city.trim();
      if (cleanHomeCity.length > 80) {
        errors.push("Home city must not exceed 80 characters.");
      }
      if (containsHtmlOrTags(cleanHomeCity)) {
        errors.push("Home city contains invalid characters or HTML tags (< or >).");
      }
    }
  }

  // 7. Avatar URL Validation
  let cleanAvatarUrl: string | null = null;
  if (raw.avatar_url !== undefined && raw.avatar_url !== null) {
    if (typeof raw.avatar_url !== "string") {
      errors.push("Avatar URL must be a string if provided.");
    } else {
      cleanAvatarUrl = raw.avatar_url.trim();
      if (cleanAvatarUrl.length > 0) {
        const isAbsoluteHttp = /^https?:\/\/[^\s<>"]+$/.test(cleanAvatarUrl);
        const isRelativePath = /^\/[^\s<>"]+$/.test(cleanAvatarUrl);
        if (!isAbsoluteHttp && !isRelativePath) {
          errors.push("Avatar URL must be a valid HTTP/HTTPS URL or relative path without malicious characters.");
        }
      } else {
        cleanAvatarUrl = null;
      }
    }
  }

  // 8. Badges Validation
  let cleanBadges: string[] = [];
  if (raw.badges !== undefined && raw.badges !== null) {
    if (!Array.isArray(raw.badges)) {
      errors.push("Badges must be an array of strings.");
    } else {
      if (raw.badges.length > 10) {
        errors.push("Cannot specify more than 10 badges.");
      }
      for (let i = 0; i < raw.badges.length; i++) {
        const badge = raw.badges[i];
        if (typeof badge !== "string") {
          errors.push(`Badge at index ${i} must be a string.`);
        } else {
          const trimmed = badge.trim();
          if (trimmed.length < 1 || trimmed.length > 40) {
            errors.push(`Badge '${trimmed}' must be between 1 and 40 characters.`);
          }
          if (containsHtmlOrTags(trimmed)) {
            errors.push(`Badge '${trimmed}' contains invalid characters or HTML tags.`);
          }
          cleanBadges.push(trimmed);
        }
      }
    }
  }

  // 9. Top Destinations Validation
  let cleanTopDestinations: string[] = [];
  if (raw.top_destinations !== undefined && raw.top_destinations !== null) {
    if (!Array.isArray(raw.top_destinations)) {
      errors.push("Top destinations must be an array of strings.");
    } else {
      if (raw.top_destinations.length > 10) {
        errors.push("Cannot specify more than 10 top destinations.");
      }
      for (let i = 0; i < raw.top_destinations.length; i++) {
        const dest = raw.top_destinations[i];
        if (typeof dest !== "string") {
          errors.push(`Top destination at index ${i} must be a string.`);
        } else {
          const trimmed = dest.trim();
          if (trimmed.length < 1 || trimmed.length > 50) {
            errors.push(`Top destination '${trimmed}' must be between 1 and 50 characters.`);
          }
          if (containsHtmlOrTags(trimmed)) {
            errors.push(`Top destination '${trimmed}' contains invalid characters or HTML tags.`);
          }
          cleanTopDestinations.push(trimmed);
        }
      }
    }
  }

  // 10. is_public Validation
  const isPublic = raw.is_public !== undefined ? Boolean(raw.is_public) : true;

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      username: (raw.username as string).trim().toLowerCase(),
      display_name: (raw.display_name as string).trim(),
      bio: cleanBio,
      avatar_url: cleanAvatarUrl,
      home_city: cleanHomeCity,
      travel_style: cleanTravelStyle,
      visited_states_count: cleanStatesCount,
      badges: cleanBadges,
      top_destinations: cleanTopDestinations,
      is_public: isPublic,
    },
  };
}

/**
 * Sanitizes and cleanses input into a guaranteed clean format.
 */
export function sanitizePublicProfileInput(input: Partial<PublicProfileInput>): PublicProfileInput {
  // Normalize and clean username
  let rawUsername = (input.username || "traveler")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);
  if (rawUsername.length < 3) {
    rawUsername = `${rawUsername}_voyager`.slice(0, 30);
  }
  if (RESERVED_USERNAMES.has(rawUsername)) {
    rawUsername = `${rawUsername}_explorer`;
  }

  const cleanDisplayName = stripHtmlTags(input.display_name || "Adventurous Voyager").slice(0, 50);
  const cleanBio = input.bio ? stripHtmlTags(input.bio).slice(0, 300) : null;
  const cleanHomeCity = input.home_city ? stripHtmlTags(input.home_city).slice(0, 80) : null;

  const validTravelStyle: TravelStyle =
    input.travel_style && ALLOWED_TRAVEL_STYLES.includes(input.travel_style)
      ? input.travel_style
      : "balanced";

  const rawStates = Number(input.visited_states_count);
  const cleanStates = Number.isInteger(rawStates) ? Math.max(0, Math.min(36, rawStates)) : 0;

  const cleanBadges = (Array.isArray(input.badges) ? input.badges : [])
    .filter((b): b is string => typeof b === "string")
    .map(stripHtmlTags)
    .filter((b) => b.length > 0 && b.length <= 40)
    .slice(0, 10);

  const cleanDestinations = (Array.isArray(input.top_destinations) ? input.top_destinations : [])
    .filter((d): d is string => typeof d === "string")
    .map(stripHtmlTags)
    .filter((d) => d.length > 0 && d.length <= 50)
    .slice(0, 10);

  let cleanAvatar: string | null = null;
  if (input.avatar_url && typeof input.avatar_url === "string") {
    const trimmed = input.avatar_url.trim();
    if (/^(https?:\/\/[^\s<>"]+|\/[^\s<>"]+)$/.test(trimmed)) {
      cleanAvatar = trimmed;
    }
  }

  return {
    username: rawUsername,
    display_name: cleanDisplayName || "Adventurous Voyager",
    bio: cleanBio,
    avatar_url: cleanAvatar,
    home_city: cleanHomeCity,
    travel_style: validTravelStyle,
    visited_states_count: cleanStates,
    badges: cleanBadges,
    top_destinations: cleanDestinations,
    is_public: input.is_public !== undefined ? Boolean(input.is_public) : true,
  };
}
