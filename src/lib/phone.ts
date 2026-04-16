/** Known European country dial codes (longest first for matching). */
const DIAL_CODES = ["+44", "+49", "+33", "+32", "+31"];

/**
 * Normalize a phone number to E.164 format.
 * Handles NL, BE, DE, FR, GB formats.
 * Examples: 0612345678 → +31612345678, 06-123-456-78 → +31612345678
 */
export function formatDutchPhone(phone: string): string {
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Already has a + prefix with known code — good to go
  if (cleaned.startsWith("+")) return cleaned;

  // Has country code without + (e.g., 31612345678)
  for (const code of DIAL_CODES) {
    const digits = code.slice(1); // "31", "32", etc.
    if (cleaned.startsWith(digits) && cleaned.length >= digits.length + 8) {
      return `+${cleaned}`;
    }
  }

  // Local format: 06... or 020... etc. → default to NL +31
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    return `+31${cleaned.slice(1)}`;
  }

  // Dutch mobile without prefix (e.g., 612345678 or 648742445)
  if (cleaned.startsWith("6") && cleaned.length === 9) {
    return `+31${cleaned}`;
  }

  // Can't normalize — return as-is
  return phone;
}
