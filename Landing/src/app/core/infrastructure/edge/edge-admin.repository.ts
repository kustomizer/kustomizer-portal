import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdminRepository, AdminStoreDetail } from '../../repositories/admin.repository';
import { Store, License, Membership, LicenseLimits } from '../../models';
import { LicenseStatus, Tier, MembershipRole, MembershipStatus } from '../../types/enums';
import {
  AdminStoresListResponse,
  AdminStoreGetRequest,
  AdminStoreGetResponse,
  AdminStoreUpdateRequest,
  AdminLicenseUpdateRequest,
} from '../../types/edge-functions';
import { EdgeClientService } from './edge-client.service';
import { DomainError } from '../../types/domain-error';

@Injectable()
export class EdgeAdminRepository implements AdminRepository {
  private readonly edgeClient = inject(EdgeClientService);

  listAllStores(): Observable<Store[]> {
    return this.edgeClient
      .callFunction<void, AdminStoresListResponse>('admin_stores_list')
      .pipe(
        map((response) =>
          response.stores.map((s) => ({
            id: s.id,
            name: s.name,
            createdAt: s.created_at,
            metadata: s.metadata,
          }))
        )
      );
  }

  getStoreDetail(storeId: string): Observable<AdminStoreDetail> {
    const request: AdminStoreGetRequest = { store_id: storeId };

    return this.edgeClient
      .callFunction<AdminStoreGetRequest, AdminStoreGetResponse>('admin_store_get', request)
      .pipe(
        map((response) => {
          const store: Store = {
            id: response.store.id,
            name: response.store.name,
            createdAt: response.store.created_at,
            metadata: response.store.metadata,
          };

          const license: License | undefined = response.license
            ? {
                id: response.license.id,
                storeId: storeId,
                status: response.license.status as LicenseStatus,
                tier: response.license.tier as Tier,
                limits: response.license.limits as LicenseLimits || {
                  stores: 1,
                  domainsPerStore: 3,
                  seats: 3,
                },
                expiresAt: response.license.expires_at,
                createdAt: response.license.created_at || new Date().toISOString(),
              }
            : undefined;

          const memberships: Membership[] = response.memberships.map((m) => ({
            id: m.id,
            storeId: storeId,
            userId: m.user_id,
            email: m.email,
            role: m.role as MembershipRole,
            status: m.status as MembershipStatus,
            createdAt: '',
          }));

          return {
            store,
            license,
            memberships,
          };
        })
      );
  }

  updateStore(storeId: string, changes: Partial<Store>): Observable<Store> {
    const request: AdminStoreUpdateRequest = {
      store_id: storeId,
      name: changes.name,
      metadata: changes.metadata,
    };

    return this.edgeClient
      .callFunction<AdminStoreUpdateRequest, { store: Store }>('admin_store_update', request)
      .pipe(map((response) => response.store));
  }

  deleteStore(storeId: string): Observable<void> {
    return this.edgeClient
      .callFunction<{ store_id: string }, void>('admin_store_delete', { store_id: storeId })
      .pipe(map(() => undefined));
  }

  updateLicense(
    licenseId: string,
    changes: {
      status?: LicenseStatus;
      tier?: Tier;
      limits?: LicenseLimits;
      expiresAt?: string;
    }
  ): Observable<License> {
    const request: AdminLicenseUpdateRequest = {
      license_id: licenseId,
      status: changes.status,
      tier: changes.tier,
      limits: changes.limits,
      expires_at: changes.expiresAt,
    };

    return this.edgeClient
      .callFunction<AdminLicenseUpdateRequest, { license: License }>('admin_license_update', request)
      .pipe(map((response) => response.license));
  }

  isAdmin(): Observable<boolean> {
    // Call admin check endpoint or inspect user metadata
    // For MVP, we can check if admin endpoints are accessible
    return this.listAllStores().pipe(
      map(() => true),
      catchError((error) => {
        // If forbidden, user is not admin
        if (error instanceof DomainError && error.type === 'Forbidden') {
          return of(false);
        }
        return of(false);
      })
    );
  }
}

