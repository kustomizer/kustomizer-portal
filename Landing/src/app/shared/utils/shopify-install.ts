const TYPO_HOST = 'shopfiy.com';
const CORRECT_HOST = 'shopify.com';

function fixCommonTypos(value: string): string {
  return value.replace(TYPO_HOST, CORRECT_HOST);
}

function normalizeShopDomain(value: string): string | null {
  let normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  normalized = normalized.replace(/^[a-z]+:\/\//i, '');
  normalized = normalized.split('/')[0].split('?')[0].split('#')[0].split(':')[0];

  while (normalized.endsWith('.myshopify.com.myshopify.com')) {
    normalized = normalized.replace(/\.myshopify\.com\.myshopify\.com$/, '.myshopify.com');
  }

  if (!normalized.endsWith('.myshopify.com')) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(normalized)) {
      return null;
    }
    normalized = `${normalized}.myshopify.com`;
  }

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function toInstallUrl(installUrl: string): URL | null {
  if (installUrl.startsWith('/')) {
    if (typeof window === 'undefined') {
      return null;
    }
    return new URL(installUrl, window.location.origin);
  }

  try {
    return new URL(installUrl);
  } catch {
    return null;
  }
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

export function buildShopifyInstallUrl(
  installUrl: string | null | undefined,
  shopDomain: string | null | undefined
): string | null {
  const resolvedInstallUrl = resolveShopifyInstallUrl(installUrl);
  if (!resolvedInstallUrl) {
    return null;
  }

  const url = toInstallUrl(resolvedInstallUrl);
  if (!url) {
    return resolvedInstallUrl;
  }

  const normalizedShopDomain = normalizeShopDomain(shopDomain ?? '');
  if (normalizedShopDomain) {
    url.searchParams.set('shop', normalizedShopDomain);
  }

  return url.toString();
}
