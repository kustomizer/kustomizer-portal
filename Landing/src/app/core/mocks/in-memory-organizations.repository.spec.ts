import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryOrganizationsRepository } from './in-memory-organizations.repository';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { MockErrorService } from './mock-error.service';

describe('InMemoryOrganizationsRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataStore, MockErrorService, MockApiService, InMemoryOrganizationsRepository],
    });
    TestBed.inject(MockDataStore).reset();
  });

  it('creates an organization', async () => {
    const repo = TestBed.inject(InMemoryOrganizationsRepository);
    const org = await firstValueFrom(repo.createOrganization('Nova Commerce'));
    const list = await firstValueFrom(repo.listOrganizations());
    expect(list.find(item => item.id === org.id)).toBeTruthy();
  });
});
