import { Observable } from 'rxjs';
import { AuthSession, User } from '../models';

export interface AuthRepository {
  listUsers(): Observable<User[]>;
  getSession(): Observable<AuthSession | null>;
  login(userId: string, orgId?: string): Observable<AuthSession>;
  register(name: string, email: string): Observable<AuthSession>;
  logout(): Observable<void>;
}
