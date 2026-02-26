import { StoreUserRole, StoreUserStatus } from '../types/enums';
import { UserEmail } from '../types/ids';

/**
 * Store user entity (maps to backend store_users table)
 */
export interface StoreUser {
  shopId: string;
  email: UserEmail;
  invitedBy?: UserEmail | null;
  role: StoreUserRole;
  status: StoreUserStatus;
  createdAt?: string;
}
