import { Injectable } from '@angular/core';
import { AuditLog, Invitation, License, Membership, Organization, Store, StoreDomain, User } from '../models';
import {
  mockAuditLogs,
  mockInvitations,
  mockLicenses,
  mockMemberships,
  mockOrganizations,
  mockStoreDomains,
  mockStores,
  mockUsers,
} from './mock-data';

@Injectable({ providedIn: 'root' })
export class MockDataStore {
  users: User[] = [...mockUsers];
  organizations: Organization[] = [...mockOrganizations];
  memberships: Membership[] = [...mockMemberships];
  invitations: Invitation[] = [...mockInvitations];
  licenses: License[] = [...mockLicenses];
  stores: Store[] = [...mockStores];
  domains: StoreDomain[] = [...mockStoreDomains];
  auditLogs: AuditLog[] = [...mockAuditLogs];

  reset(): void {
    this.users = [...mockUsers];
    this.organizations = [...mockOrganizations];
    this.memberships = [...mockMemberships];
    this.invitations = [...mockInvitations];
    this.licenses = [...mockLicenses];
    this.stores = [...mockStores];
    this.domains = [...mockStoreDomains];
    this.auditLogs = [...mockAuditLogs];
  }
}
