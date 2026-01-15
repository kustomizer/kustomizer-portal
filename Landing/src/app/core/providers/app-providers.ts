import { Provider } from '@angular/core';
import {
  AUDIT_LOGS_REPOSITORY,
  AUTH_REPOSITORY,
  DOMAINS_REPOSITORY,
  LICENSES_REPOSITORY,
  ORGANIZATIONS_REPOSITORY,
  STORES_REPOSITORY,
} from '../repositories';
import { InMemoryAuditLogsRepository } from '../mocks/in-memory-audit-logs.repository';
import { InMemoryAuthRepository } from '../mocks/in-memory-auth.repository';
import { InMemoryDomainsRepository } from '../mocks/in-memory-domains.repository';
import { InMemoryLicensesRepository } from '../mocks/in-memory-licenses.repository';
import { InMemoryOrganizationsRepository } from '../mocks/in-memory-organizations.repository';
import { InMemoryStoresRepository } from '../mocks/in-memory-stores.repository';

export const provideMockRepositories = (): Provider[] => [
  { provide: AUTH_REPOSITORY, useClass: InMemoryAuthRepository },
  { provide: ORGANIZATIONS_REPOSITORY, useClass: InMemoryOrganizationsRepository },
  { provide: LICENSES_REPOSITORY, useClass: InMemoryLicensesRepository },
  { provide: STORES_REPOSITORY, useClass: InMemoryStoresRepository },
  { provide: DOMAINS_REPOSITORY, useClass: InMemoryDomainsRepository },
  { provide: AUDIT_LOGS_REPOSITORY, useClass: InMemoryAuditLogsRepository },
];
