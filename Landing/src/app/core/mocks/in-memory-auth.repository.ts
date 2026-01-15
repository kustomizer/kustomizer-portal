import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRepository } from '../repositories';
import { AuthSession, User } from '../models';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { createId, nowIso } from './mock-helpers';

@Injectable()
export class InMemoryAuthRepository implements AuthRepository {
  private readonly storageKey = 'kustomizer.session';
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);

  constructor(
    private readonly store: MockDataStore,
    private readonly api: MockApiService
  ) {
    this.loadSession();
  }

  listUsers(): Observable<User[]> {
    return this.api.simulate([...this.store.users], { failureKey: 'auth.listUsers' });
  }

  getSession(): Observable<AuthSession | null> {
    return this.sessionSubject.asObservable();
  }

  login(userId: string, orgId?: string): Observable<AuthSession> {
    const membership = this.resolveMembership(userId, orgId);
    if (!membership) {
      return this.api.simulateError('No organization membership found for user.');
    }

    const session: AuthSession = {
      userId,
      orgId: membership.orgId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };

    return this.api.simulate(session, { failureKey: 'auth.login' }).pipe(
      tap(value => this.persistSession(value))
    );
  }

  register(name: string, email: string): Observable<AuthSession> {
    const user: User = {
      id: createId('user'),
      name,
      email,
      role: 'user',
      createdAt: nowIso(),
    };

    const orgId = createId('org');
    this.store.users.push(user);
    this.store.organizations.push({
      id: orgId,
      name: `${name.split(' ')[0] || 'New'} Workspace`,
      createdAt: nowIso(),
    });
    this.store.memberships.push({
      id: createId('member'),
      orgId,
      userId: user.id,
      role: 'owner',
      createdAt: nowIso(),
    });
    this.store.licenses.push({
      id: createId('license'),
      orgId,
      status: 'trial',
      tier: 'starter',
      startedAt: nowIso(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      limits: {
        stores: 1,
        domainsPerStore: 3,
        seats: 3,
      },
    });

    const session: AuthSession = {
      userId: user.id,
      orgId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };

    return this.api.simulate(session, { failureKey: 'auth.register' }).pipe(
      tap(value => this.persistSession(value))
    );
  }

  logout(): Observable<void> {
    return this.api.simulate(undefined, { failureKey: 'auth.logout' }).pipe(
      tap(() => this.clearSession())
    );
  }

  private resolveMembership(userId: string, orgId?: string) {
    if (orgId) {
      return this.store.memberships.find(m => m.userId === userId && m.orgId === orgId);
    }
    return this.store.memberships.find(m => m.userId === userId) || null;
  }

  private persistSession(session: AuthSession): void {
    this.sessionSubject.next(session);
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private clearSession(): void {
    this.sessionSubject.next(null);
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.storageKey);
  }

  private loadSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }
    try {
      const session = JSON.parse(raw) as AuthSession;
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.clearSession();
        return;
      }
      this.sessionSubject.next(session);
    } catch {
      this.clearSession();
    }
  }
}
