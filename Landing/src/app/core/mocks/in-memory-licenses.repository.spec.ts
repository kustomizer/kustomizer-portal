import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryLicensesRepository } from './in-memory-licenses.repository';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { MockErrorService } from './mock-error.service';

describe('InMemoryLicensesRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataStore, MockErrorService, MockApiService, InMemoryLicensesRepository],
    });
    TestBed.inject(MockDataStore).reset();
  });

  it('updates license status', async () => {
    const repo = TestBed.inject(InMemoryLicensesRepository);
    const licenses = await firstValueFrom(repo.listLicenses());
    const target = licenses[0];
    const updated = await firstValueFrom(repo.updateLicense(target.id, { status: 'active' }));
    expect(updated.status).toBe('active');
  });
});
