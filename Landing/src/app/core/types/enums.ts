// License tier enum (domain-centric schema uses text)
export enum Tier {
  Starter = 'starter',
  Growth = 'growth',
  Enterprise = 'enterprise',
}

// Store user roles (domain-centric schema)
export enum StoreUserRole {
  Owner = 'owner',
  Admin = 'admin',
  Reader = 'reader',
}

// Store user status (domain-centric schema)
export enum StoreUserStatus {
  Active = 'active',
  Removed = 'removed',
  Pending = 'pending',
}

// Global Role enum (for system-wide permissions)
export enum GlobalRole {
  User = 'user',
  Admin = 'admin',
}
