import { GlobalRole } from '../types/enums';
import { UserId, StoreDomain } from '../types/ids';

/**
 * Global roles for system-wide permissions
 */
export { GlobalRole };

/**
 * Auth session model
 *
 * IMPORTANT: userId is UUID (string), storeDomain is the store primary key.
 */
export interface AuthSession {
  userId: UserId;
  storeDomain: StoreDomain;
  expiresAt: string;
}

/**
 * Supabase auth user type
 *
 * NOTE: Supabase auth.users IDs are UUIDs (strings), not bigints
 */
export interface SupabaseUser {
  id: UserId;
  email?: string;
  created_at: string;
  app_metadata?: {
    role?: GlobalRole;
  };
  user_metadata?: {
    name?: string;
  };
}

/**
 * User model
 *
 * NOTE: Supabase auth.users IDs are UUIDs (strings), not bigints
 */
export interface User {
  id: UserId;
  email: string;
  name?: string;
  role?: GlobalRole;
  createdAt?: string;
}
