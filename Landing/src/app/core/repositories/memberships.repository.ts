import { Observable } from 'rxjs';
import { Membership, Invitation } from '../models';
import { MembershipRole } from '../types/enums';

export interface MembershipsRepository {
  listMembers(storeId: string): Observable<Membership[]>;
  listMembershipsForUser(userId: string): Observable<Membership[]>;
  
  // Invitation management (via Edge Functions)
  sendInvitation(
    storeId: string,
    email: string,
    role: MembershipRole,
    expiresInDays?: number
  ): Observable<{ inviteUrl: string; membershipKey: string }>;
  
  acceptInvitation(membershipKey: string): Observable<Membership>;
  
  // Membership management
  removeMembership(membershipId: string): Observable<void>;
  updateMembershipRole(membershipId: string, role: MembershipRole): Observable<Membership>;
}

