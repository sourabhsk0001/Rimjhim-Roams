// ==============================================================================
// Money & Integer Minor Units Precision Helpers
// Ensures zero floating-point drift (e.g. 0.1 + 0.2 != 0.3) across calculations.
// ==============================================================================

export const MINOR_UNIT_SCALE = 100; // 1 INR = 100 paise; 1 USD = 100 cents

/**
 * Converts a major currency amount (e.g. ₹20,000.50) to integer minor units (e.g. 2000050 paise).
 */
export function toMinorUnits(majorAmount: number): number {
  if (!Number.isFinite(majorAmount)) return 0;
  return Math.round(majorAmount * MINOR_UNIT_SCALE);
}

/**
 * Converts integer minor units back to major currency units (e.g. 2000050 -> 20000.50).
 */
export function fromMinorUnits(minorUnits: number): number {
  if (!Number.isFinite(minorUnits)) return 0;
  return Math.round(minorUnits) / MINOR_UNIT_SCALE;
}

/**
 * Adds two minor unit amounts safely with integer rounding.
 */
export function addMinor(a: number, b: number): number {
  return Math.round(a) + Math.round(b);
}

/**
 * Subtracts two minor unit amounts safely.
 */
export function subtractMinor(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

/**
 * Multiplies minor units by a scalar factor and rounds to nearest integer minor unit.
 */
export function multiplyMinor(minorUnits: number, factor: number): number {
  return Math.round(minorUnits * factor);
}

/**
 * Calculates a percentage of a minor unit amount with integer rounding.
 */
export function percentageMinor(minorUnits: number, percentage: number): number {
  return Math.round((minorUnits * percentage) / 100);
}

/**
 * Formats a currency amount into a clean localized string (e.g. "₹20,000" or "₹19,500.50").
 */
export function formatCurrency(
  amount: number,
  options: { isMinor?: boolean; currency?: string; showFractions?: boolean } = {}
): string {
  const { isMinor = false, currency = "INR", showFractions = false } = options;
  const major = isMinor ? fromMinorUnits(amount) : amount;

  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;

  const hasFraction = Math.abs(major % 1) > 0.001;
  const fractionDigits = showFractions || hasFraction ? 2 : 0;

  const formattedNumber = Math.abs(major).toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const sign = major < 0 ? "-" : "";
  return `${sign}${symbol}${formattedNumber}`;
}
