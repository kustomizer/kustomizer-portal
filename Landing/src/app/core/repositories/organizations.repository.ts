import { Observable } from 'rxjs';
import { Invitation, Membership, MembershipRole, Organization } from '../models';

export interface OrganizationsRepository {
  listOrganizations(): Observable<Organization[]>;
  getOrganization(id: string): Observable<Organization | null>;
  createOrganization(name: string): Observable<Organization>;
  updateOrganization(id: string, changes: Partial<Organization>): Observable<Organization>;
  deleteOrganization(id: string): Observable<void>;

  listMemberships(orgId: string): Observable<Membership[]>;
  listMembershipsForUser(userId: string): Observable<Membership[]>;
  addMembership(orgId: string, userId: string, role: MembershipRole): Observable<Membership>;
  removeMembership(membershipId: string): Observable<void>;

  listInvitations(orgId: string): Observable<Invitation[]>;
  inviteMember(
    orgId: string,
    email: string,
    role: MembershipRole,
    invitedByUserId: string
  ): Observable<Invitation>;
  acceptInvitation(invitationId: string, userId: string): Observable<Membership>;
}
