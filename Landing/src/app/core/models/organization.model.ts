// DEPRECATED: This file is kept for backward compatibility
// Use ./store.model.ts and ./membership.model.ts instead

export type { Store as Organization } from './store.model';
export type { Membership } from './membership.model';
export type { Invitation } from './membership.model';

/** @deprecated Use MembershipRole from '../types/enums' instead */
export type MembershipRoleString = 'owner' | 'admin' | 'member';
