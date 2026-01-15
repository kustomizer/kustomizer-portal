import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DomainsRepository } from '../repositories';
import { StoreDomain } from '../models';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { createId, nowIso } from './mock-helpers';

@Injectable()
export class InMemoryDomainsRepository implements DomainsRepository {
  constructor(
    private readonly store: MockDataStore,
    private readonly api: MockApiService
  ) {}

  listDomains(storeId: string): Observable<StoreDomain[]> {
    const domains = this.store.domains.filter(item => item.storeId === storeId);
    return this.api.simulate([...domains], { failureKey: 'domains.list' });
  }

  addDomain(storeId: string, domain: string): Observable<StoreDomain> {
    const created: StoreDomain = {
      id: createId('domain'),
      storeId,
      domain,
      createdAt: nowIso(),
    };
    this.store.domains.push(created);
    return this.api.simulate(created, { failureKey: 'domains.add' });
  }

  removeDomain(domainId: string): Observable<void> {
    this.store.domains = this.store.domains.filter(item => item.id !== domainId);
    return this.api.simulate(undefined, { failureKey: 'domains.remove' });
  }
}
