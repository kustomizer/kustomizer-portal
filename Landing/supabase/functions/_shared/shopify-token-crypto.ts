const PRIMARY_KEY_ENV = 'SHOPIFY_TOKEN_ENCRYPTION_KEY';
const LEGACY_KEY_ENVS = ['SHOPIFY_TOKEN_ENCRYPTION_KEY_LEGACY', 'SHOPIFY_LEGACY_TOKEN_ENCRYPTION_KEY'];

type KeySource = 'primary' | 'legacy';

type KeyCandidate = {
  envName: string;
  keyB64: string;
  source: KeySource;
};

type EncryptResult = {
  ciphertextB64: string;
  ivB64: string;
};

export type DecryptShopifyTokenResult = {
  token: string;
  keySource: KeySource;
  keyEnv: string;
};

const cachedCryptoKeys = new Map<string, CryptoKey>();

function asNonEmptyString(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function getRequiredPrimaryKeyValue(): string {
  const value = asNonEmptyString(Deno.env.get(PRIMARY_KEY_ENV));
  if (!value) {
    throw new Error(`Missing ${PRIMARY_KEY_ENV}`);
  }

  return value;
}

function getDecryptionKeyCandidates(): KeyCandidate[] {
  const candidates: KeyCandidate[] = [];
  const seenValues = new Set<string>();

  const primaryValue = asNonEmptyString(Deno.env.get(PRIMARY_KEY_ENV));
  if (primaryValue) {
    seenValues.add(primaryValue);
    candidates.push({
      envName: PRIMARY_KEY_ENV,
      keyB64: primaryValue,
      source: 'primary',
    });
  }

  for (const envName of LEGACY_KEY_ENVS) {
    const value = asNonEmptyString(Deno.env.get(envName));
    if (!value || seenValues.has(value)) {
      continue;
    }

    seenValues.add(value);
    candidates.push({
      envName,
      keyB64: value,
      source: 'legacy',
    });
  }

  return candidates;
}

async function importCryptoKey(envName: string, keyB64: string): Promise<CryptoKey> {
  const existing = cachedCryptoKeys.get(envName);
  if (existing) {
    return existing;
  }

  const rawKey = base64ToBytes(keyB64);
  const imported = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
  cachedCryptoKeys.set(envName, imported);
  return imported;
}

export async function encryptShopifyToken(token: string): Promise<EncryptResult> {
  const keyB64 = getRequiredPrimaryKeyValue();
  const key = await importCryptoKey(PRIMARY_KEY_ENV, keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(token);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    ciphertextB64: bytesToBase64(new Uint8Array(ciphertext)),
    ivB64: bytesToBase64(iv),
  };
}

export async function decryptShopifyToken(
  ciphertextB64: string,
  ivB64: string
): Promise<DecryptShopifyTokenResult> {
  const candidates = getDecryptionKeyCandidates();

  if (candidates.length === 0) {
    throw new Error(`Missing ${PRIMARY_KEY_ENV}`);
  }

  const iv = base64ToBytes(ivB64);
  const ciphertext = base64ToBytes(ciphertextB64);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const key = await importCryptoKey(candidate.envName, candidate.keyB64);
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

      return {
        token: new TextDecoder().decode(plaintext),
        keySource: candidate.source,
        keyEnv: candidate.envName,
      };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Failed to decrypt Shopify token');
}
