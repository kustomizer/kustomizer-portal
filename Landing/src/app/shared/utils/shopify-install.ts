const TYPO_HOST = 'shopfiy.com';
const CORRECT_HOST = 'shopify.com';

function fixCommonTypos(value: string): string {
  return value.replace(TYPO_HOST, CORRECT_HOST);
}

export function resolveShopifyInstallUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const corrected = fixCommonTypos(raw);

  if (corrected.startsWith('/')) {
    return corrected;
  }

  try {
    const parsed = new URL(corrected);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
