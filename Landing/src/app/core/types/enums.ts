// License Status enum (backend uses int8)
export enum LicenseStatus {
  Trial = 0,
  Active = 1,
  Expired = 2,
  Suspended = 3,
}

// License Tier enum (backend uses int8)
export enum Tier {
  Starter = 0,
  Growth = 1,
  Enterprise = 2,
}

// Membership Role enum (backend uses int8)
export enum MembershipRole {
  Owner = 0,
  Admin = 1,
  Member = 2,
}

// Membership Status enum (backend uses int8)
export enum MembershipStatus {
  Pending = 0,
  Active = 1,
  Revoked = 2,
  Expired = 3,
}

// Global Role enum (for system-wide permissions)
export enum GlobalRole {
  User = 'user',
  Admin = 'admin',
}
