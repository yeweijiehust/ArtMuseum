export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function cleanText(value: string | undefined, maxLength: number) {
  const text = value?.trim() ?? "";
  if (!text) {
    return null;
  }
  return text.slice(0, maxLength);
}

export function cleanRequiredText(value: string | undefined, maxLength: number) {
  const text = value?.trim() ?? "";
  if (!text) {
    return null;
  }
  return text.slice(0, maxLength);
}
