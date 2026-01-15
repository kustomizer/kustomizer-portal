export function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remove protocol (http://, https://, etc.)
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');

  // Remove path, query, and hash
  const slashIndex = domain.indexOf('/');
  if (slashIndex !== -1) {
    domain = domain.substring(0, slashIndex);
  }

  const questionIndex = domain.indexOf('?');
  if (questionIndex !== -1) {
    domain = domain.substring(0, questionIndex);
  }

  const hashIndex = domain.indexOf('#');
  if (hashIndex !== -1) {
    domain = domain.substring(0, hashIndex);
  }

  // Remove port
  const colonIndex = domain.indexOf(':');
  if (colonIndex !== -1) {
    domain = domain.substring(0, colonIndex);
  }

  return domain;
}

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length === 0) {
    return false;
  }

  // Basic domain regex: alphanumeric, dots, and hyphens
  // Must have at least one dot and valid TLD
  const domainRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

  return domainRegex.test(domain);
}

export function getDomainValidationError(domain: string): string | null {
  const normalized = normalizeDomain(domain);

  if (!normalized) {
    return 'Domain is required';
  }

  if (normalized.length < 4) {
    return 'Domain is too short';
  }

  if (normalized.length > 253) {
    return 'Domain is too long';
  }

  if (!isValidDomain(normalized)) {
    return 'Invalid domain format. Example: example.com';
  }

  return null;
}

