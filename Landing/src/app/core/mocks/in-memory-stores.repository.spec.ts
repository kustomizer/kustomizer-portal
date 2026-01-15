import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryStoresRepository } from './in-memory-stores.repository';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { MockErrorService } from './mock-error.service';

describe('InMemoryStoresRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataStore, MockErrorService, MockApiService, InMemoryStoresRepository],
    });
    TestBed.inject(MockDataStore).reset();
  });

  it('creates a store for an org', async () => {
    const repo = TestBed.inject(InMemoryStoresRepository);
    const created = await firstValueFrom(
      repo.createStore('org-1', {
        shopDomain: 'new-store.myshopify.com',
        status: 'connected',
        connected: true,
        lastSyncAt: undefined,
        lastError: undefined,
        metadata: {},
      })
    );
    const list = await firstValueFrom(repo.listStores('org-1'));
    expect(list.some(store => store.id === created.id)).toBe(true);
  });
});
