import { StoreUserRole, StoreUserStatus } from '../types/enums';
import { StoreDomain, UserEmail } from '../types/ids';

/**
 * Store user entity (maps to backend store_users table)
 */
export interface StoreUser {
  domain: StoreDomain;
  email: UserEmail;
  invitedBy?: UserEmail | null;
  role: StoreUserRole;
  status: StoreUserStatus;
  createdAt?: string;
}
