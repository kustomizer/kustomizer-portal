import { GlobalRole } from '../types/enums';
import { UserId } from '../types/ids';

/**
 * Global roles for system-wide permissions
 */
export { GlobalRole };

/**
 * Auth session model
 *
 * IMPORTANT: userId is UUID (string), storeId is the shop primary key.
 */
export interface AuthSession {
  userId: UserId;
  storeId: string;
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
