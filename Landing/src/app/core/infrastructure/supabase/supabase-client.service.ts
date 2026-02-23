import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { AuthSession } from '../../models';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly supabase: SupabaseClient;
  private readonly authStateSubject = new BehaviorSubject<AuthSession | null | undefined>(undefined);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Initialize auth state listener
    this.initAuthStateListener();
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get authState$(): Observable<AuthSession | null> {
    return this.authStateSubject.asObservable().pipe(
      filter((session): session is AuthSession | null => session !== undefined)
    );
  }

  async getSession(): Promise<AuthSession | null> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return this.mapToAuthSession(session);
  }

  async getUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  }

  private initAuthStateListener(): void {
    // Get initial session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.authStateSubject.next(session ? this.mapToAuthSession(session) : null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.authStateSubject.next(session ? this.mapToAuthSession(session) : null);
    });
  }

  private mapToAuthSession(session: Session): AuthSession {
    // For now, we'll use a default storeId until the user selects one
    // The StoreContextFacade will manage the actual active store
    return {
      userId: session.user.id,
      storeDomain: '', // Will be set by StoreContextFacade
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
    };
  }
}
