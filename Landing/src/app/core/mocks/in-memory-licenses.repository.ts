import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LicensesRepository } from '../repositories';
import { License } from '../models';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { createId, nowIso } from './mock-helpers';

@Injectable()
export class InMemoryLicensesRepository implements LicensesRepository {
  constructor(
    private readonly store: MockDataStore,
    private readonly api: MockApiService
  ) {}

  listLicenses(): Observable<License[]> {
    return this.api.simulate([...this.store.licenses], { failureKey: 'licenses.list' });
  }

  getLicenseForOrg(orgId: string): Observable<License | null> {
    const license = this.store.licenses.find(item => item.orgId === orgId) ?? null;
    return this.api.simulate(license, { failureKey: 'licenses.get' });
  }

  updateLicense(id: string, changes: Partial<License>): Observable<License> {
    const licenseIndex = this.store.licenses.findIndex(item => item.id === id);
    if (licenseIndex === -1) {
      return this.api.simulateError('License not found.');
    }
    const updated = { ...this.store.licenses[licenseIndex], ...changes };
    this.store.licenses[licenseIndex] = updated;
    return this.api.simulate(updated, { failureKey: 'licenses.update' });
  }

  createLicense(orgId: string, license: Omit<License, 'id' | 'orgId'>): Observable<License> {
    const created: License = {
      ...license,
      id: createId('license'),
      orgId,
      startedAt: license.startedAt ?? nowIso(),
    };
    this.store.licenses.push(created);
    return this.api.simulate(created, { failureKey: 'licenses.create' });
  }
}
