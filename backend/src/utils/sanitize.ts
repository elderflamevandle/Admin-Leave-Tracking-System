/**
 * Server-side input sanitization.
 * Strips HTML tags and trims whitespace from all string fields.
 */

const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeText(value: string): string {
  return value
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHAR_RE, "")
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result) as (keyof T)[]) {
    if (typeof result[key] === "string") {
      (result as Record<string, unknown>)[key as string] = sanitizeText(result[key] as string);
    }
  }
  return result;
}
