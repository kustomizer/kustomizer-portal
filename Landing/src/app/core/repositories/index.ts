import { InjectionToken } from '@angular/core';
import { AuthRepository } from './auth.repository';
import { StoresRepository } from './stores.repository';
import { LicensesRepository } from './licenses.repository';
import { DomainsRepository } from './domains.repository';
import { MembershipsRepository } from './memberships.repository';
import { BootstrapRepository } from './bootstrap.repository';
import { AdminRepository } from './admin.repository';
import { AuditLogsRepository } from './audit-logs.repository';

// Injection tokens
export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
export const STORES_REPOSITORY = new InjectionToken<StoresRepository>('StoresRepository');
export const LICENSES_REPOSITORY = new InjectionToken<LicensesRepository>('LicensesRepository');
export const DOMAINS_REPOSITORY = new InjectionToken<DomainsRepository>('DomainsRepository');
export const MEMBERSHIPS_REPOSITORY = new InjectionToken<MembershipsRepository>('MembershipsRepository');
export const BOOTSTRAP_REPOSITORY = new InjectionToken<BootstrapRepository>('BootstrapRepository');
export const ADMIN_REPOSITORY = new InjectionToken<AdminRepository>('AdminRepository');
export const AUDIT_LOGS_REPOSITORY = new InjectionToken<AuditLogsRepository>('AuditLogsRepository');

// Deprecated - use STORES_REPOSITORY instead
export const ORGANIZATIONS_REPOSITORY = STORES_REPOSITORY;

// Repository interfaces
export * from './auth.repository';
export * from './stores.repository';
export * from './licenses.repository';
export * from './domains.repository';
export * from './memberships.repository';
export * from './bootstrap.repository';
export * from './admin.repository';
export * from './audit-logs.repository';
