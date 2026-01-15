// This file is deprecated - use StoresRepository and MembershipsRepository instead
// Kept for backward compatibility during migration

import { Observable } from 'rxjs';
import { Invitation, Membership, Store } from '../models';
import { MembershipRole } from '../types/enums';

export type Organization = Store;

/**
 * @deprecated Use StoresRepository and MembershipsRepository instead
 */
export interface OrganizationsRepository {
  listOrganizations(): Observable<Store[]>;
  getOrganization(id: string): Observable<Store | null>;
  createOrganization(name: string): Observable<Store>;
  updateOrganization(id: string, changes: Partial<Store>): Observable<Store>;
  deleteOrganization(id: string): Observable<void>;

  listMemberships(storeId: string): Observable<Membership[]>;
  listMembershipsForUser(userId: string): Observable<Membership[]>;
  addMembership(storeId: string, userId: string, role: MembershipRole): Observable<Membership>;
  removeMembership(membershipId: string): Observable<void>;

  listInvitations(storeId: string): Observable<Invitation[]>;
  inviteMember(
    storeId: string,
    email: string,
    role: MembershipRole,
    invitedByUserId: string
  ): Observable<Invitation>;
  acceptInvitation(invitationId: string, userId: string): Observable<Membership>;
}
