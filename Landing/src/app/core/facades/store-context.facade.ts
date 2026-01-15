import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError, shareReplay } from 'rxjs/operators';
import { Store } from '../models';
import { Tier } from '../types/enums';
import { STORES_REPOSITORY, BOOTSTRAP_REPOSITORY } from '../repositories';
import { Loadable, toLoadable } from '../../shared/utils/loadable';
import { StorageService } from '../services/storage.service';

export interface StoreContextViewModel {
  stores: Store[];
  activeStore: Store | null;
  needsBootstrap: boolean;
  isLoading: boolean;
  error?: string;
}

const ACTIVE_STORE_KEY = 'active_store_id';

@Injectable({ providedIn: 'root' })
export class StoreContextFacade {
  private readonly storesRepo = inject(STORES_REPOSITORY);
  private readonly bootstrapRepo = inject(BOOTSTRAP_REPOSITORY);
  private readonly storage = inject(StorageService);

  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private readonly activeStoreIdSubject = new BehaviorSubject<string | null>(
    this.getStoredActiveStoreId()
  );

  // Load stores whenever refresh is triggered
  private readonly stores$ = this.refreshTrigger$.pipe(
    switchMap(() => this.storesRepo.listMyStores()),
    tap((stores) => {
      // Auto-select first store if none is active
      const activeId = this.activeStoreIdSubject.value;
      if (stores.length > 0 && (!activeId || !stores.find((s) => s.id === activeId))) {
        this.setActiveStore(stores[0].id);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly activeStoreId$ = this.activeStoreIdSubject.asObservable();

  readonly vm$: Observable<Loadable<StoreContextViewModel>> = combineLatest([
    toLoadable(this.stores$, (stores) => stores.length === 0),
    this.activeStoreId$,
  ]).pipe(
    map(([storesLoadable, activeStoreId]) => {
      if (storesLoadable.state === 'loading') {
        return {
          state: 'loading' as const,
        };
      }

      if (storesLoadable.state === 'error') {
        return {
          state: 'error' as const,
          error: storesLoadable.error,
        };
      }

      const stores = storesLoadable.data || [];
      const activeStore = stores.find((s) => s.id === activeStoreId) || null;
      const needsBootstrap = stores.length === 0;

      const vm: StoreContextViewModel = {
        stores,
        activeStore,
        needsBootstrap,
        isLoading: false,
        error: storesLoadable.error,
      };

      return {
        state: needsBootstrap ? ('empty' as const) : ('ready' as const),
        data: vm,
      };
    })
  );

  loadStores(): void {
    this.refreshTrigger$.next();
  }

  bootstrapStore(storeName: string, tier: Tier): Observable<void> {
    return this.bootstrapRepo.bootstrapNewUser(storeName, tier).pipe(
      tap((response) => {
        // Set the newly created store as active
        this.setActiveStore(response.storeId);
        // Refresh stores list
        this.refreshTrigger$.next();
      }),
      map(() => undefined),
      catchError((error) => {
        console.error('Bootstrap failed:', error);
        throw error;
      })
    );
  }

  setActiveStore(storeId: string): void {
    this.activeStoreIdSubject.next(storeId);
    this.saveActiveStoreId(storeId);
  }

  getActiveStore(): Observable<Store | null> {
    return combineLatest([this.stores$, this.activeStoreId$]).pipe(
      map(([stores, activeId]) => {
        if (!activeId) return null;
        return stores.find((s) => s.id === activeId) || null;
      })
    );
  }

  private getStoredActiveStoreId(): string | null {
    return this.storage.getItem(ACTIVE_STORE_KEY);
  }

  private saveActiveStoreId(storeId: string): void {
    this.storage.setItem(ACTIVE_STORE_KEY, storeId);
  }
}

