import { InjectionToken } from '@angular/core';
import { AuthRepository } from './auth.repository';
import { StoresRepository } from './stores.repository';
import { LicensesRepository } from './licenses.repository';
import { StoreUsersRepository } from './store-users.repository';
import { BootstrapRepository } from './bootstrap.repository';
import { AdminRepository } from './admin.repository';
import { AuditLogsRepository } from './audit-logs.repository';

// Injection tokens
export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
export const STORES_REPOSITORY = new InjectionToken<StoresRepository>('StoresRepository');
export const LICENSES_REPOSITORY = new InjectionToken<LicensesRepository>('LicensesRepository');
export const STORE_USERS_REPOSITORY = new InjectionToken<StoreUsersRepository>('StoreUsersRepository');
export const BOOTSTRAP_REPOSITORY = new InjectionToken<BootstrapRepository>('BootstrapRepository');
export const ADMIN_REPOSITORY = new InjectionToken<AdminRepository>('AdminRepository');
export const AUDIT_LOGS_REPOSITORY = new InjectionToken<AuditLogsRepository>('AuditLogsRepository');

// Repository interfaces
export * from './auth.repository';
export * from './stores.repository';
export * from './licenses.repository';
export * from './store-users.repository';
export * from './bootstrap.repository';
export * from './admin.repository';
export * from './audit-logs.repository';
