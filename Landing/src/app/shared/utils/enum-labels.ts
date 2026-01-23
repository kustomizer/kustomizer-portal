import { StoreUserRole, StoreUserStatus, Tier } from '../../core/types/enums';

/**
 * Get human-readable label for license status based on active/expiration.
 */
export function getLicenseStatusLabel(active: boolean, expiresAt?: string | null): string {
  if (!active) {
    return 'Expired';
  }
  if (!expiresAt) {
    return 'Active';
  }
  const days = getDaysUntilExpiration(expiresAt);
  if (days !== null && days <= 14) {
    return 'Expiring';
  }
  return 'Active';
}

/**
 * Get human-readable label for tier
 */
export function getTierLabel(tier: Tier): string {
  switch (tier) {
    case Tier.Starter:
      return 'Starter';
    case Tier.Growth:
      return 'Growth';
    case Tier.Enterprise:
      return 'Enterprise';
    default:
      return 'Unknown';
  }
}

/**
 * Get human-readable label for store user role
 */
export function getStoreUserRoleLabel(role: StoreUserRole): string {
  switch (role) {
    case StoreUserRole.Owner:
      return 'Owner';
    case StoreUserRole.Admin:
      return 'Admin';
    case StoreUserRole.Reader:
      return 'Read-only';
    default:
      return 'Unknown';
  }
}

/**
 * Get human-readable label for store user status
 */
export function getStoreUserStatusLabel(status: StoreUserStatus): string {
  switch (status) {
    case StoreUserStatus.Pending:
      return 'Pending';
    case StoreUserStatus.Active:
      return 'Active';
    case StoreUserStatus.Removed:
      return 'Removed';
    default:
      return 'Unknown';
  }
}

/**
 * Get CSS class for license status badge
 */
export function getLicenseStatusClass(active: boolean, expiresAt?: string | null): string {
  if (!active) {
    return 'status-expired';
  }
  const days = expiresAt ? getDaysUntilExpiration(expiresAt) : null;
  if (days !== null && days <= 14) {
    return 'status-warning';
  }
  return 'status-active';
}

/**
 * Get tier features description
 */
export function getTierFeatures(tier: Tier): string[] {
  switch (tier) {
    case Tier.Starter:
      return ['Single store', 'Core editor features', 'Email support'];
    case Tier.Growth:
      return ['Multiple stores', 'Advanced editor features', 'Priority support'];
    case Tier.Enterprise:
      return [
        'Unlimited stores',
        'Dedicated support',
        'Custom integrations',
      ];
    default:
      return [];
  }
}

/**
 * Calculate days until expiration
 */
export function getDaysUntilExpiration(expiresAt?: string): number | null {
  if (!expiresAt) {
    return null;
  }

  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get human-readable expiration string
 */
export function getExpirationLabel(expiresAt?: string): string {
  if (!expiresAt) {
    return 'Never';
  }

  const days = getDaysUntilExpiration(expiresAt);
  if (days === null) {
    return 'Never';
  }

  if (days < 0) {
    return 'Expired';
  }

  if (days === 0) {
    return 'Expires today';
  }

  if (days === 1) {
    return 'Expires tomorrow';
  }

  if (days < 30) {
    return `Expires in ${days} days`;
  }

  const months = Math.floor(days / 30);
  if (months === 1) {
    return 'Expires in 1 month';
  }

  return `Expires in ${months} months`;
}
