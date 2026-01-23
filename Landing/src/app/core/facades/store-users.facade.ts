import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap, shareReplay } from 'rxjs/operators';
import { StoreUser } from '../models';
import { StoreUserRole, StoreUserStatus } from '../types/enums';
import { STORE_USERS_REPOSITORY } from '../repositories';
import { StoreContextFacade } from './store-context.facade';
import { Loadable, toLoadable } from '../../shared/utils/loadable';
import {
  getStoreUserRoleLabel,
  getStoreUserStatusLabel,
} from '../../shared/utils/enum-labels';

export interface StoreUserViewModel extends StoreUser {
  roleLabel: string;
  statusLabel: string;
}

export interface StoreUsersViewModel {
  users: StoreUserViewModel[];
}

@Injectable({ providedIn: 'root' })
export class StoreUsersFacade {
  private readonly storeUsersRepo = inject(STORE_USERS_REPOSITORY);
  private readonly storeContext = inject(StoreContextFacade);

  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);

  readonly vm$: Observable<Loadable<StoreUsersViewModel>> = this.storeContext.activeStoreId$.pipe(
    switchMap((storeId) => {
      if (!storeId) {
        return of<Loadable<StoreUsersViewModel>>({
          state: 'empty',
          data: { users: [] },
        });
      }

      return this.refreshTrigger$.pipe(
        switchMap(() =>
          toLoadable(
            this.storeUsersRepo.listStoreUsers(storeId).pipe(
              map((users) => ({
                users: users.map((user) => this.toStoreUserViewModel(user)),
              }))
            ),
            (vm) => vm.users.length === 0
          )
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  loadMembers(): void {
    this.refreshTrigger$.next();
  }

  inviteUser(email: string, role: StoreUserRole): Observable<StoreUser> {
    return this.storeContext.activeStoreId$.pipe(
      switchMap((storeId) => {
        if (!storeId) {
          throw new Error('No active store selected');
        }

        return this.storeUsersRepo.inviteStoreUser(storeId, email, role).pipe(
          tap(() => this.refreshTrigger$.next())
        );
      })
    );
  }

  removeUser(email: string): Observable<StoreUser> {
    return this.storeContext.activeStoreId$.pipe(
      switchMap((storeId) => {
        if (!storeId) {
          throw new Error('No active store selected');
        }
        return this.storeUsersRepo
          .updateStoreUserStatus(storeId, email, StoreUserStatus.Removed)
          .pipe(tap(() => this.refreshTrigger$.next()));
      })
    );
  }

  private toStoreUserViewModel(user: StoreUser): StoreUserViewModel {
    return {
      ...user,
      roleLabel: getStoreUserRoleLabel(user.role),
      statusLabel: getStoreUserStatusLabel(user.status),
    };
  }
}
