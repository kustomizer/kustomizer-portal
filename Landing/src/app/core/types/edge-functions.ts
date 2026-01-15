// Bootstrap New User
export interface BootstrapNewUserRequest {
  store_name: string;
  tier: number; // 0=Starter, 1=Growth, 2=Enterprise
}

export interface BootstrapNewUserResponse {
  store_id: string;
  license_id: string;
  membership_id: string;
}

// Add Domain
export interface AddDomainRequest {
  store_id: string;
  domain: string;
}

export interface AddDomainResponse {
  domain_id: string;
}

// Remove Domain
export interface RemoveDomainRequest {
  domain_id: string;
}

// Send Invitation
export interface SendInvitationRequest {
  store_id: string;
  email: string;
  role: number; // 0=Owner, 1=Admin, 2=Member
  expires_in_days?: number;
}

export interface SendInvitationResponse {
  invite_url: string;
  membership_key: string;
}

// Accept Invitation
export interface AcceptInvitationRequest {
  membership_key: string;
}

export interface AcceptInvitationResponse {
  membership_id: string;
  store_id: string;
}

// Update License Tier
export interface UpdateLicenseTierRequest {
  store_id: string;
  tier: number;
}

// License Check (public)
export interface LicenseCheckRequest {
  store_id: string;
  domain: string;
}

export interface LicenseCheckResponse {
  valid: boolean;
  tier: number;
  status: number;
  expires_at?: string;
}

// Admin - List Stores
export interface AdminStoresListResponse {
  stores: Array<{
    id: string;
    name: string;
    created_at: string;
    metadata?: Record<string, any>;
  }>;
}

// Admin - Get Store
export interface AdminStoreGetRequest {
  store_id: string;
}

export interface AdminStoreGetResponse {
  store: {
    id: string;
    name: string;
    created_at: string;
    metadata?: Record<string, any>;
  };
  license?: {
    id: string;
    status: number;
    tier: number;
    limits: Record<string, any>;
    expires_at?: string;
    created_at?: string;
  };
  memberships: Array<{
    id: string;
    user_id: string;
    email: string;
    role: number;
    status: number;
  }>;
}

// Admin - Update Store
export interface AdminStoreUpdateRequest {
  store_id: string;
  name?: string;
  metadata?: Record<string, any>;
}

// Admin - Update License
export interface AdminLicenseUpdateRequest {
  license_id: string;
  status?: number;
  tier?: number;
  limits?: Record<string, any>;
  expires_at?: string;
}

