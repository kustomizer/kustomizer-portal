import { MembershipRole, MembershipStatus } from '../types/enums';
import { MembershipId, StoreId, UserId } from '../types/ids';

/**
 * Membership entity (maps to backend memberships table)
 *
 * IMPORTANT: IDs are bigint in database but come as strings from PostgREST
 * to avoid JavaScript number precision issues.
 *
 * @see https://supabase.com/docs/guides/api/rest/postgres-types#bigint-int8
 */
export interface Membership {
  id: MembershipId;
  storeId: StoreId;
  userId: UserId;
  email: string;
  role: MembershipRole; // 0=Owner, 1=Admin, 2=Member
  status: MembershipStatus; // 0=Pending, 1=Active, 2=Revoked, 3=Expired
  membershipKey?: string;
  expiresAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

// Invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

/**
 * Invitation model - temporary link for accepting membership
 *
 * IMPORTANT: IDs are bigint in database but come as strings from PostgREST
 */
export interface Invitation {
  id: MembershipId; // Same as membership ID
  storeId: StoreId;
  email: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitedByUserId: UserId;
  createdAt: string;
  acceptedAt?: string;
}
