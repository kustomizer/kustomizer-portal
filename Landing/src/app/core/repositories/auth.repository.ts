import { Observable } from 'rxjs';
import { AuthSession, User } from '../models';

export interface AuthRepository {
  // Authentication methods
  signUp(email: string, password: string): Observable<void>;
  signIn(email: string, password: string): Observable<AuthSession>;
  signOut(): Observable<void>;
  getSession(): Observable<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
  
  // User methods (for mock/testing)
  listUsers(): Observable<User[]>;
  getCurrentUser(): Observable<User | null>;
}
