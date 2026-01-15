import { AuditLog, Invitation, License, Membership, Organization, Store, StoreDomain, User } from '../models';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sofia Alvarez',
    email: 'sofia@lunaatelier.com',
    role: 'user',
    createdAt: '2024-10-02T09:12:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Diego Ramirez',
    email: 'diego@northwind.co',
    role: 'user',
    createdAt: '2024-10-08T11:05:00.000Z',
  },
  {
    id: 'user-3',
    name: 'Kustomizer Admin',
    email: 'admin@kustomizer.io',
    role: 'admin',
    createdAt: '2024-09-22T08:00:00.000Z',
  },
];

export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Luna Atelier',
    createdAt: '2024-09-30T10:00:00.000Z',
  },
  {
    id: 'org-2',
    name: 'Northwind Retail',
    createdAt: '2024-10-05T14:30:00.000Z',
  },
];

export const mockMemberships: Membership[] = [
  {
    id: 'member-1',
    orgId: 'org-1',
    userId: 'user-1',
    role: 'owner',
    createdAt: '2024-09-30T10:05:00.000Z',
  },
  {
    id: 'member-2',
    orgId: 'org-1',
    userId: 'user-2',
    role: 'member',
    createdAt: '2024-10-09T12:00:00.000Z',
  },
  {
    id: 'member-3',
    orgId: 'org-2',
    userId: 'user-2',
    role: 'owner',
    createdAt: '2024-10-05T14:35:00.000Z',
  },
  {
    id: 'member-4',
    orgId: 'org-1',
    userId: 'user-3',
    role: 'member',
    createdAt: '2024-10-12T09:30:00.000Z',
  },
];

export const mockInvitations: Invitation[] = [
  {
    id: 'invite-1',
    orgId: 'org-1',
    email: 'new@lunaatelier.com',
    role: 'member',
    status: 'pending',
    invitedByUserId: 'user-1',
    createdAt: '2024-11-01T10:10:00.000Z',
  },
];

export const mockLicenses: License[] = [
  {
    id: 'license-1',
    orgId: 'org-1',
    status: 'trial',
    tier: 'starter',
    startedAt: '2024-10-01T09:00:00.000Z',
    expiresAt: '2024-11-10T09:00:00.000Z',
    limits: {
      stores: 1,
      domainsPerStore: 3,
      seats: 3,
    },
  },
  {
    id: 'license-2',
    orgId: 'org-2',
    status: 'active',
    tier: 'growth',
    startedAt: '2024-10-06T09:00:00.000Z',
    expiresAt: '2025-04-06T09:00:00.000Z',
    limits: {
      stores: 3,
      domainsPerStore: 10,
      seats: 12,
    },
  },
];

export const mockStores: Store[] = [
  {
    id: 'store-1',
    orgId: 'org-1',
    shopDomain: 'luna-atelier.myshopify.com',
    status: 'connected',
    connected: true,
    lastSyncAt: '2024-11-05T16:20:00.000Z',
    metadata: {
      shopName: 'Luna Atelier',
      email: 'support@lunaatelier.com',
      country: 'AR',
      currency: 'ARS',
      installedAt: '2024-10-01T09:05:00.000Z',
    },
    createdAt: '2024-10-01T09:00:00.000Z',
  },
  {
    id: 'store-2',
    orgId: 'org-2',
    shopDomain: 'northwind-supply.myshopify.com',
    status: 'error',
    connected: true,
    lastSyncAt: '2024-11-02T13:10:00.000Z',
    lastError: 'Webhook signature mismatch',
    metadata: {
      shopName: 'Northwind Supply',
      email: 'ops@northwind.co',
      country: 'US',
      currency: 'USD',
      installedAt: '2024-10-06T09:15:00.000Z',
    },
    createdAt: '2024-10-06T09:00:00.000Z',
  },
];

export const mockStoreDomains: StoreDomain[] = [
  {
    id: 'domain-1',
    storeId: 'store-1',
    domain: 'lunaatelier.com',
    createdAt: '2024-10-02T10:30:00.000Z',
  },
  {
    id: 'domain-2',
    storeId: 'store-1',
    domain: 'shop.lunaatelier.com',
    createdAt: '2024-10-15T08:20:00.000Z',
  },
  {
    id: 'domain-3',
    storeId: 'store-2',
    domain: 'northwind.co',
    createdAt: '2024-10-10T12:00:00.000Z',
  },
  {
    id: 'domain-4',
    storeId: 'store-2',
    domain: 'b2b.northwind.co',
    createdAt: '2024-10-12T12:15:00.000Z',
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    actorId: 'user-1',
    action: 'created',
    entityType: 'license',
    entityId: 'license-1',
    timestamp: '2024-10-01T09:10:00.000Z',
    summary: 'Started trial for Starter tier',
  },
  {
    id: 'log-2',
    actorId: 'user-2',
    action: 'added',
    entityType: 'domain',
    entityId: 'domain-3',
    timestamp: '2024-10-10T12:05:00.000Z',
    summary: 'Added northwind.co to allowlist',
  },
  {
    id: 'log-3',
    actorId: 'user-3',
    action: 'updated',
    entityType: 'store',
    entityId: 'store-2',
    timestamp: '2024-11-02T13:15:00.000Z',
    summary: 'Marked store sync error',
  },
];
