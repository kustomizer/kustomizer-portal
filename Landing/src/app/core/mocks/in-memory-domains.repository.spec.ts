import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryDomainsRepository } from './in-memory-domains.repository';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { MockErrorService } from './mock-error.service';

describe('InMemoryDomainsRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataStore, MockErrorService, MockApiService, InMemoryDomainsRepository],
    });
    TestBed.inject(MockDataStore).reset();
  });

  it('adds a domain to a store', async () => {
    const repo = TestBed.inject(InMemoryDomainsRepository);
    const domain = await firstValueFrom(repo.addDomain('store-1', 'newdomain.com'));
    const list = await firstValueFrom(repo.listDomains('store-1'));
    expect(list.some(item => item.id === domain.id)).toBe(true);
  });
});
