import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthRepository } from '../../repositories/auth.repository';
import { AuthSession, User } from '../../models';
import { GlobalRole } from '../../types/enums';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

@Injectable()
export class SupabaseAuthRepository implements AuthRepository {
  private readonly supabaseClient = inject(SupabaseClientService);

  signUp(email: string, password: string, name?: string): Observable<AuthSession | null> {
    return from(
      this.supabaseClient.client.auth.signUp({
        email,
        password,
        options: name ? { data: { name } } : undefined,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        if (!data.user) {
          throw mapSupabaseErrorToDomainError({ message: 'Sign up failed' });
        }
        if (!data.session) {
          return null;
        }
        return {
          userId: data.session.user.id,
          storeId: '',
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        };
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  signIn(email: string, password: string): Observable<AuthSession> {
    return from(
      this.supabaseClient.client.auth.signInWithPassword({
        email,
        password,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        if (!data.session) {
          throw mapSupabaseErrorToDomainError({ message: 'Sign in failed' });
        }
        return {
          userId: data.session.user.id,
          storeId: '', // Will be set by StoreContextFacade
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        };
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  signOut(): Observable<void> {
    return from(this.supabaseClient.client.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return undefined;
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  getSession(): Observable<AuthSession | null> {
    return this.supabaseClient.authState$;
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const subscription = this.supabaseClient.authState$.subscribe(callback);
    return () => subscription.unsubscribe();
  }

  getCurrentUser(): Observable<User | null> {
    return from(this.supabaseClient.getUser()).pipe(
      switchMap((supabaseUser) => {
        if (!supabaseUser) {
          return of(null);
        }

        // Map Supabase user to our User model
        const user: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.['name'] || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          role: (supabaseUser.app_metadata?.['role'] as GlobalRole) || GlobalRole.User,
          createdAt: supabaseUser.created_at,
        };

        return of(user);
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  listUsers(): Observable<User[]> {
    // This is primarily for mock/testing
    // In production, use admin API or separate service
    return this.getCurrentUser().pipe(map((user) => (user ? [user] : [])));
  }
}
