export type GlobalRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: GlobalRole;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  orgId: string;
  expiresAt: string;
}
