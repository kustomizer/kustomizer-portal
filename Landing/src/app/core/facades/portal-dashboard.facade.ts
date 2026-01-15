import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { AuthFacade } from './auth.facade';
import { toLoadable } from '../../shared/utils/loadable';
import { LICENSES_REPOSITORY, ORGANIZATIONS_REPOSITORY, STORES_REPOSITORY } from '../repositories';
import { Invitation, MembershipRole, Store } from '../models';

@Injectable({ providedIn: 'root' })
export class PortalDashboardFacade {
  private readonly auth = inject(AuthFacade);
  private readonly organizations = inject(ORGANIZATIONS_REPOSITORY);
  private readonly licenses = inject(LICENSES_REPOSITORY);
  private readonly stores = inject(STORES_REPOSITORY);
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  private readonly orgId$ = this.auth.session$.pipe(
    map(session => session?.orgId),
    filter((orgId): orgId is string => Boolean(orgId)),
    shareReplay(1)
  );

  readonly license$ = combineLatest([this.orgId$, this.refreshSubject]).pipe(
    switchMap(([orgId]) => toLoadable(this.licenses.getLicenseForOrg(orgId), license => !license)),
    shareReplay(1)
  );

  readonly stores$ = combineLatest([this.orgId$, this.refreshSubject]).pipe(
    switchMap(([orgId]) => toLoadable(this.stores.listStores(orgId), stores => stores.length === 0)),
    shareReplay(1)
  );

  readonly invitations$ = combineLatest([this.orgId$, this.refreshSubject]).pipe(
    switchMap(([orgId]) => toLoadable(this.organizations.listInvitations(orgId), invites => invites.length === 0)),
    shareReplay(1)
  );

  readonly members$ = combineLatest([this.orgId$, this.refreshSubject]).pipe(
    switchMap(([orgId]) =>
      toLoadable(
        combineLatest([
          this.organizations.listMemberships(orgId),
          this.auth.listUsers(),
        ]).pipe(
          map(([memberships, users]) =>
            memberships.map(member => ({
              ...member,
              user: users.find(user => user.id === member.userId) ?? null,
            }))
          )
        ),
        members => members.length === 0
      )
    ),
    shareReplay(1)
  );

  inviteMember(email: string, role: MembershipRole): Observable<Invitation> {
    return this.auth.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('No active user session.'));
        }
        return this.orgId$.pipe(
          take(1),
          switchMap(orgId => this.organizations.inviteMember(orgId, email, role, user.id))
        );
      })
    );
  }

  acceptInvitation(invitationId: string): Observable<unknown> {
    return this.auth.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('No active user session.'));
        }
        return this.organizations.acceptInvitation(invitationId, user.id);
      })
    );
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

  storeStatusLabel(store: Store): string {
    if (store.status === 'error') {
      return 'Needs attention';
    }
    return store.status === 'connected' ? 'Connected' : 'Disconnected';
  }
}
