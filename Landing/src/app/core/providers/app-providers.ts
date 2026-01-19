import { Provider } from '@angular/core';
import {
  AUDIT_LOGS_REPOSITORY,
  AUTH_REPOSITORY,
  LICENSES_REPOSITORY,
  STORES_REPOSITORY,
  STORE_USERS_REPOSITORY,
  BOOTSTRAP_REPOSITORY,
  ADMIN_REPOSITORY,
} from '../repositories';

// Mock repositories are temporarily disabled until they're updated to match new interfaces
// Use production repositories (provideProductionRepositories) instead

export const provideMockRepositories = (): Provider[] => [
  // TODO: Update mock repositories to match new interfaces
  // For now, use provideProductionRepositories() in app.config.ts
  
  // Commented out until mocks are updated:
  // { provide: AUTH_REPOSITORY, useClass: InMemoryAuthRepository },
  // { provide: STORES_REPOSITORY, useClass: InMemoryStoresRepository },
  // { provide: LICENSES_REPOSITORY, useClass: InMemoryLicensesRepository },
  // { provide: STORE_USERS_REPOSITORY, useClass: InMemoryStoreUsersRepository },
  // { provide: BOOTSTRAP_REPOSITORY, useClass: InMemoryBootstrapRepository },
  // { provide: ADMIN_REPOSITORY, useClass: InMemoryAdminRepository },
  // { provide: AUDIT_LOGS_REPOSITORY, useClass: InMemoryAuditLogsRepository },
];
