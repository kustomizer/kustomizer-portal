import { Injectable, inject } from '@angular/core';
import { combineLatest, defer, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthSession, Organization, User } from '../models';
import { AUTH_REPOSITORY, ORGANIZATIONS_REPOSITORY } from '../repositories';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authRepository = inject(AUTH_REPOSITORY);
  private readonly orgRepository = inject(ORGANIZATIONS_REPOSITORY);

  private readonly users$ = defer(() => this.authRepository.listUsers()).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly session$ = this.authRepository.getSession().pipe(shareReplay(1));
  readonly currentUser$ = combineLatest([this.session$, this.users$]).pipe(
    map(([session, users]) => users.find(user => user.id === session?.userId) ?? null),
    shareReplay(1)
  );
  readonly activeOrganization$ = this.session$.pipe(
    switchMap(session => (session ? this.orgRepository.getOrganization(session.orgId) : of(null))),
    shareReplay(1)
  );

  listUsers(): Observable<User[]> {
    return this.users$;
  }

  login(userId: string, orgId?: string): Observable<AuthSession> {
    return this.authRepository.login(userId, orgId);
  }

  register(name: string, email: string): Observable<AuthSession> {
    return this.authRepository.register(name, email);
  }

  logout(): Observable<void> {
    return this.authRepository.logout();
  }

  getActiveOrganization(): Observable<Organization | null> {
    return this.activeOrganization$;
  }
}
