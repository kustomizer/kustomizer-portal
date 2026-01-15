export type MembershipRole = 'owner' | 'member';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface Invitation {
  id: string;
  orgId: string;
  email: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitedByUserId: string;
  createdAt: string;
  acceptedAt?: string;
}
