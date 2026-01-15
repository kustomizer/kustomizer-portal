export type StoreStatus = 'connected' | 'disconnected' | 'error';

export interface StoreMetadata {
  shopName?: string;
  email?: string;
  country?: string;
  currency?: string;
  installedAt?: string;
}

export interface Store {
  id: string;
  orgId: string;
  shopDomain: string;
  status: StoreStatus;
  connected: boolean;
  lastSyncAt?: string;
  lastError?: string;
  metadata?: StoreMetadata;
  createdAt: string;
}

export interface StoreDomain {
  id: string;
  storeId: string;
  domain: string;
  createdAt: string;
}
