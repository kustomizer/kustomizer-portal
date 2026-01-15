import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryAuditLogsRepository } from './in-memory-audit-logs.repository';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { MockErrorService } from './mock-error.service';

describe('InMemoryAuditLogsRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataStore, MockErrorService, MockApiService, InMemoryAuditLogsRepository],
    });
    TestBed.inject(MockDataStore).reset();
  });

  it('adds an audit log entry', async () => {
    const repo = TestBed.inject(InMemoryAuditLogsRepository);
    const created = await firstValueFrom(
      repo.addAuditLog({
        actorId: 'user-1',
        action: 'updated',
        entityType: 'license',
        entityId: 'license-1',
        summary: 'Updated license tier',
      })
    );
    const list = await firstValueFrom(repo.listAuditLogs());
    expect(list.find(item => item.id === created.id)).toBeTruthy();
  });
});
