// Bootstrap Owner Store
export interface BootstrapOwnerStoreRequest {
  store_name: string;
  domain: string;
  tier: string;
}

export interface BootstrapOwnerStoreResponse {
  store_domain: string;
  license_id: string;
}

// Invite Store User
export interface InviteStoreUserRequest {
  domain: string;
  email: string;
  role: string;
}

export interface InviteStoreUserResponse {
  domain: string;
  email: string;
  role: string;
  status: string;
}

// Remove Store User
export interface RemoveStoreUserRequest {
  domain: string;
  email: string;
}

// Kustomizer Auth (public)
export interface KustomizerAuthRequest {
  domain: string;
  email: string;
}

export interface KustomizerAuthResponse {
  store_user: {
    role: string;
    status: string;
  };
  license: {
    active: boolean;
    expiresAt?: string | null;
    tier: string;
  };
}

// Admin - List Stores
export interface AdminStoresListResponse {
  stores: Array<{
    domain: string;
    name: string;
    created_at: string;
    owner_id: string;
  }>;
}

// Admin - Get Store
export interface AdminStoreGetRequest {
  domain: string;
}

export interface AdminStoreGetResponse {
  store: {
    domain: string;
    name: string;
    created_at: string;
    owner_id: string;
  };
  license: {
    id: string;
    tier: string;
    expires_at?: string | null;
    created_at: string;
  } | null;
  store_users: Array<{
    email: string;
    invited_by?: string | null;
    role: string;
    status: string;
    created_at?: string;
  }>;
}

// Admin - Update Store
export interface AdminStoreUpdateRequest {
  domain: string;
  name?: string;
  owner_id?: string;
}

// Admin - Update License
export interface AdminLicenseUpdateRequest {
  license_id: string;
  tier?: string;
  expires_at?: string | null;
}
