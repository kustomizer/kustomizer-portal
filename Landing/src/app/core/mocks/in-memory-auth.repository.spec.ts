import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryAuthRepository } from './in-memory-auth.repository';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { MockErrorService } from './mock-error.service';

describe('InMemoryAuthRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataStore, MockErrorService, MockApiService, InMemoryAuthRepository],
    });
    TestBed.inject(MockDataStore).reset();
    localStorage.clear();
  });

  it('logs in a seeded user', async () => {
    const repo = TestBed.inject(InMemoryAuthRepository);
    const session = await firstValueFrom(repo.login('user-1'));
    expect(session.userId).toBe('user-1');
    expect(session.orgId).toBe('org-1');
  });
});
