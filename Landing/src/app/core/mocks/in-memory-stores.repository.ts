import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StoresRepository } from '../repositories';
import { Store } from '../models';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { createId, nowIso } from './mock-helpers';

@Injectable()
export class InMemoryStoresRepository implements StoresRepository {
  constructor(
    private readonly store: MockDataStore,
    private readonly api: MockApiService
  ) {}

  listStores(orgId: string): Observable<Store[]> {
    const stores = this.store.stores.filter(item => item.orgId === orgId);
    return this.api.simulate([...stores], { failureKey: 'stores.list' });
  }

  getStore(id: string): Observable<Store | null> {
    const store = this.store.stores.find(item => item.id === id) ?? null;
    return this.api.simulate(store, { failureKey: 'stores.get' });
  }

  createStore(orgId: string, store: Omit<Store, 'id' | 'orgId' | 'createdAt'>): Observable<Store> {
    const created: Store = {
      ...store,
      id: createId('store'),
      orgId,
      createdAt: nowIso(),
    };
    this.store.stores.push(created);
    return this.api.simulate(created, { failureKey: 'stores.create' });
  }

  updateStore(id: string, changes: Partial<Store>): Observable<Store> {
    const storeIndex = this.store.stores.findIndex(item => item.id === id);
    if (storeIndex === -1) {
      return this.api.simulateError('Store not found.');
    }
    const updated = { ...this.store.stores[storeIndex], ...changes };
    this.store.stores[storeIndex] = updated;
    return this.api.simulate(updated, { failureKey: 'stores.update' });
  }

  deleteStore(id: string): Observable<void> {
    this.store.stores = this.store.stores.filter(item => item.id !== id);
    this.store.domains = this.store.domains.filter(domain => domain.storeId !== id);
    return this.api.simulate(undefined, { failureKey: 'stores.delete' });
  }
}
