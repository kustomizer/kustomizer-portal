import { LicenseStatus, Tier, MembershipRole, MembershipStatus } from '../../core/types/enums';

/**
 * Get human-readable label for license status
 */
export function getLicenseStatusLabel(status: LicenseStatus): string {
  switch (status) {
    case LicenseStatus.Trial:
      return 'Trial';
    case LicenseStatus.Active:
      return 'Active';
    case LicenseStatus.Expired:
      return 'Expired';
    case LicenseStatus.Suspended:
      return 'Suspended';
    default:
      return 'Unknown';
  }
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
 * Get human-readable label for membership role
 */
export function getMembershipRoleLabel(role: MembershipRole): string {
  switch (role) {
    case MembershipRole.Owner:
      return 'Owner';
    case MembershipRole.Admin:
      return 'Admin';
    case MembershipRole.Member:
      return 'Member';
    default:
      return 'Unknown';
  }
}

/**
 * Get human-readable label for membership status
 */
export function getMembershipStatusLabel(status: MembershipStatus): string {
  switch (status) {
    case MembershipStatus.Pending:
      return 'Pending';
    case MembershipStatus.Active:
      return 'Active';
    case MembershipStatus.Revoked:
      return 'Revoked';
    case MembershipStatus.Expired:
      return 'Expired';
    default:
      return 'Unknown';
  }
}

/**
 * Get CSS class for license status badge
 */
export function getLicenseStatusClass(status: LicenseStatus): string {
  switch (status) {
    case LicenseStatus.Trial:
      return 'status-trial';
    case LicenseStatus.Active:
      return 'status-active';
    case LicenseStatus.Expired:
      return 'status-expired';
    case LicenseStatus.Suspended:
      return 'status-suspended';
    default:
      return 'status-unknown';
  }
}

/**
 * Get tier features description
 */
export function getTierFeatures(tier: Tier): string[] {
  switch (tier) {
    case Tier.Starter:
      return ['1 store', '5 domains per store', '3 team members', 'Basic support'];
    case Tier.Growth:
      return ['5 stores', '20 domains per store', '10 team members', 'Priority support'];
    case Tier.Enterprise:
      return [
        'Unlimited stores',
        'Unlimited domains',
        'Unlimited team members',
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

