import { InjectionToken } from '@angular/core';
import { AuthRepository } from './auth.repository';
import { OrganizationsRepository } from './organizations.repository';
import { LicensesRepository } from './licenses.repository';
import { StoresRepository } from './stores.repository';
import { DomainsRepository } from './domains.repository';
import { AuditLogsRepository } from './audit-logs.repository';

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
export const ORGANIZATIONS_REPOSITORY = new InjectionToken<OrganizationsRepository>('OrganizationsRepository');
export const LICENSES_REPOSITORY = new InjectionToken<LicensesRepository>('LicensesRepository');
export const STORES_REPOSITORY = new InjectionToken<StoresRepository>('StoresRepository');
export const DOMAINS_REPOSITORY = new InjectionToken<DomainsRepository>('DomainsRepository');
export const AUDIT_LOGS_REPOSITORY = new InjectionToken<AuditLogsRepository>('AuditLogsRepository');

export * from './auth.repository';
export * from './organizations.repository';
export * from './licenses.repository';
export * from './stores.repository';
export * from './domains.repository';
export * from './audit-logs.repository';
