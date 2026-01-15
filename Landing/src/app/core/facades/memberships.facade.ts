import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap, shareReplay } from 'rxjs/operators';
import { Membership } from '../models';
import { MembershipRole } from '../types/enums';
import { MEMBERSHIPS_REPOSITORY } from '../repositories';
import { StoreContextFacade } from './store-context.facade';
import { Loadable, toLoadable } from '../../shared/utils/loadable';
import {
  getMembershipRoleLabel,
  getMembershipStatusLabel,
} from '../../shared/utils/enum-labels';

export interface MemberViewModel extends Membership {
  roleLabel: string;
  statusLabel: string;
}

export interface MembershipsViewModel {
  members: MemberViewModel[];
  inviteUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class MembershipsFacade {
  private readonly membershipsRepo = inject(MEMBERSHIPS_REPOSITORY);
  private readonly storeContext = inject(StoreContextFacade);

  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private readonly inviteUrlSubject = new BehaviorSubject<string | null>(null);

  readonly vm$: Observable<Loadable<MembershipsViewModel>> = this.storeContext.activeStoreId$.pipe(
    switchMap((storeId) => {
      if (!storeId) {
        return of<Loadable<MembershipsViewModel>>({
          state: 'empty',
          data: { members: [], inviteUrl: null },
        });
      }

      return this.refreshTrigger$.pipe(
        switchMap(() =>
          toLoadable(
            this.membershipsRepo.listMembers(storeId).pipe(
              map((members) => ({
                members: members.map((m) => this.toMemberViewModel(m)),
                inviteUrl: this.inviteUrlSubject.value,
              }))
            ),
            (vm) => vm.members.length === 0
          )
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  loadMembers(): void {
    this.refreshTrigger$.next();
  }

  sendInvitation(
    email: string,
    role: MembershipRole,
    expiresInDays?: number
  ): Observable<string> {
    return this.storeContext.activeStoreId$.pipe(
      switchMap((storeId) => {
        if (!storeId) {
          throw new Error('No active store selected');
        }

        return this.membershipsRepo.sendInvitation(storeId, email, role, expiresInDays).pipe(
          tap((response) => {
            this.inviteUrlSubject.next(response.inviteUrl);
            // Refresh members list
            this.refreshTrigger$.next();
          }),
          map((response) => response.inviteUrl)
        );
      })
    );
  }

  acceptInvitation(membershipKey: string): Observable<Membership> {
    return this.membershipsRepo.acceptInvitation(membershipKey).pipe(
      tap(() => {
        // Refresh members list
        this.refreshTrigger$.next();
      })
    );
  }

  clearInviteUrl(): void {
    this.inviteUrlSubject.next(null);
  }

  private toMemberViewModel(membership: Membership): MemberViewModel {
    return {
      ...membership,
      roleLabel: getMembershipRoleLabel(membership.role),
      statusLabel: getMembershipStatusLabel(membership.status),
    };
  }
}

