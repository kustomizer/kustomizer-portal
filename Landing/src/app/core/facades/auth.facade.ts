import { Injectable, inject } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthSession, Store, User } from '../models';
import { AUTH_REPOSITORY, STORES_REPOSITORY } from '../repositories';
import { StoreContextFacade } from './store-context.facade';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authRepository = inject(AUTH_REPOSITORY);
  private readonly storesRepository = inject(STORES_REPOSITORY);
  private readonly storeContext = inject(StoreContextFacade);

  readonly session$ = this.authRepository.getSession().pipe(shareReplay(1));
  
  readonly currentUser$ = this.authRepository.getCurrentUser().pipe(shareReplay(1));

  // Get active store from StoreContextFacade
  readonly activeStore$ = this.storeContext.getActiveStore().pipe(shareReplay(1));

  listUsers(): Observable<User[]> {
    return this.authRepository.listUsers();
  }

  signUp(email: string, password: string, name?: string): Observable<AuthSession | null> {
    return this.authRepository.signUp(email, password, name);
  }

  signIn(email: string, password: string): Observable<AuthSession> {
    return this.authRepository.signIn(email, password);
  }

  logout(): Observable<void> {
    return this.authRepository.signOut();
  }

  getActiveStore(): Observable<Store | null> {
    return this.activeStore$;
  }
}
