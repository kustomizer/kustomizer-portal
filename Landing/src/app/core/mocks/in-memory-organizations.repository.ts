import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrganizationsRepository } from '../repositories';
import { Invitation, Membership, MembershipRole, Organization } from '../models';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { createId, nowIso } from './mock-helpers';

@Injectable()
export class InMemoryOrganizationsRepository implements OrganizationsRepository {
  constructor(
    private readonly store: MockDataStore,
    private readonly api: MockApiService
  ) {}

  listOrganizations(): Observable<Organization[]> {
    return this.api.simulate([...this.store.organizations], { failureKey: 'orgs.list' });
  }

  getOrganization(id: string): Observable<Organization | null> {
    const org = this.store.organizations.find(item => item.id === id) ?? null;
    return this.api.simulate(org, { failureKey: 'orgs.get' });
  }

  createOrganization(name: string): Observable<Organization> {
    const org: Organization = {
      id: createId('org'),
      name,
      createdAt: nowIso(),
    };
    this.store.organizations.push(org);
    return this.api.simulate(org, { failureKey: 'orgs.create' });
  }

  updateOrganization(id: string, changes: Partial<Organization>): Observable<Organization> {
    const orgIndex = this.store.organizations.findIndex(item => item.id === id);
    if (orgIndex === -1) {
      return this.api.simulateError('Organization not found.');
    }
    const updated = { ...this.store.organizations[orgIndex], ...changes };
    this.store.organizations[orgIndex] = updated;
    return this.api.simulate(updated, { failureKey: 'orgs.update' });
  }

  deleteOrganization(id: string): Observable<void> {
    this.store.organizations = this.store.organizations.filter(item => item.id !== id);
    this.store.memberships = this.store.memberships.filter(item => item.orgId !== id);
    this.store.invitations = this.store.invitations.filter(item => item.orgId !== id);
    this.store.licenses = this.store.licenses.filter(item => item.orgId !== id);
    const storesToRemove = this.store.stores.filter(store => store.orgId === id).map(store => store.id);
    this.store.stores = this.store.stores.filter(store => store.orgId !== id);
    this.store.domains = this.store.domains.filter(domain => !storesToRemove.includes(domain.storeId));
    this.store.auditLogs = this.store.auditLogs.filter(log => log.entityId !== id);
    return this.api.simulate(undefined, { failureKey: 'orgs.delete' });
  }

  listMemberships(orgId: string): Observable<Membership[]> {
    const memberships = this.store.memberships.filter(item => item.orgId === orgId);
    return this.api.simulate([...memberships], { failureKey: 'orgs.memberships' });
  }

  listMembershipsForUser(userId: string): Observable<Membership[]> {
    const memberships = this.store.memberships.filter(item => item.userId === userId);
    return this.api.simulate([...memberships], { failureKey: 'orgs.membershipsUser' });
  }

  addMembership(orgId: string, userId: string, role: MembershipRole): Observable<Membership> {
    const membership: Membership = {
      id: createId('member'),
      orgId,
      userId,
      role,
      createdAt: nowIso(),
    };
    this.store.memberships.push(membership);
    return this.api.simulate(membership, { failureKey: 'orgs.membershipAdd' });
  }

  removeMembership(membershipId: string): Observable<void> {
    this.store.memberships = this.store.memberships.filter(item => item.id !== membershipId);
    return this.api.simulate(undefined, { failureKey: 'orgs.membershipRemove' });
  }

  listInvitations(orgId: string): Observable<Invitation[]> {
    const invites = this.store.invitations.filter(item => item.orgId === orgId);
    return this.api.simulate([...invites], { failureKey: 'orgs.invites' });
  }

  inviteMember(
    orgId: string,
    email: string,
    role: MembershipRole,
    invitedByUserId: string
  ): Observable<Invitation> {
    const invitation: Invitation = {
      id: createId('invite'),
      orgId,
      email,
      role,
      status: 'pending',
      invitedByUserId,
      createdAt: nowIso(),
    };
    this.store.invitations.push(invitation);
    return this.api.simulate(invitation, { failureKey: 'orgs.invite' });
  }

  acceptInvitation(invitationId: string, userId: string): Observable<Membership> {
    const invitation = this.store.invitations.find(item => item.id === invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return this.api.simulateError('Invitation is no longer available.');
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = nowIso();

    const membership: Membership = {
      id: createId('member'),
      orgId: invitation.orgId,
      userId,
      role: invitation.role,
      createdAt: nowIso(),
    };
    this.store.memberships.push(membership);

    return this.api.simulate(membership, { failureKey: 'orgs.inviteAccept' });
  }
}
