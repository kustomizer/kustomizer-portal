import { Observable } from 'rxjs';
import { AuthSession, User } from '../models';

export interface AuthRepository {
  signUp(email: string, password: string, name?: string): Observable<AuthSession | null>;
  signIn(email: string, password: string): Observable<AuthSession>;
  signOut(): Observable<void>;
  getSession(): Observable<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;

  listUsers(): Observable<User[]>;
  getCurrentUser(): Observable<User | null>;
}
