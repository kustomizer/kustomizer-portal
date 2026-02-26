import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdminRepository, AdminStoreDetail } from '../../repositories/admin.repository';
import { Store, License, StoreUser } from '../../models';
import { StoreUserRole, StoreUserStatus, Tier } from '../../types/enums';
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
    return this.edgeClient.callFunction<void, AdminStoresListResponse>('admin_stores_list').pipe(
      map((response) =>
        response.stores.map((s) => ({
          id: s.id,
          shopifyDomain: s.shopify_domain,
          name: s.name,
          createdAt: s.created_at,
          ownerEmail: s.owner_email,
        }))
      )
    );
  }

  getStoreDetail(storeId: string): Observable<AdminStoreDetail> {
    const request: AdminStoreGetRequest = { shop_id: storeId };

    return this.edgeClient
      .callFunction<AdminStoreGetRequest, AdminStoreGetResponse>('admin_store_get', request)
      .pipe(
        map((response) => {
          const store: Store = {
            id: response.store.id,
            shopifyDomain: response.store.shopify_domain,
            name: response.store.name,
            createdAt: response.store.created_at,
            ownerEmail: response.store.owner_email,
          };

          const license: License | null = response.license
            ? {
                id: response.license.id,
                tier: response.license.tier as Tier,
                createdAt: response.license.created_at,
                expiresAt: response.license.expires_at ?? null,
                active:
                  !response.license.expires_at ||
                  new Date(response.license.expires_at) > new Date(),
              }
            : null;

          const storeUsers: StoreUser[] = response.store_users.map((m) => ({
            shopId: m.shop_id,
            email: m.email,
            invitedBy: m.invited_by ?? null,
            role: m.role as StoreUserRole,
            status: m.status as StoreUserStatus,
            createdAt: m.created_at,
          }));

          return {
            store,
            license,
            storeUsers,
          };
        })
      );
  }

  updateStore(storeId: string, changes: Partial<Store>): Observable<Store> {
    const request: AdminStoreUpdateRequest = {
      shop_id: storeId,
      name: changes.name,
      owner_email: changes.ownerEmail,
    };

    return this.edgeClient
      .callFunction<AdminStoreUpdateRequest, { store: any }>('admin_store_update', request)
      .pipe(
        map((response) => ({
          id: response.store.id,
          shopifyDomain: response.store.shopify_domain,
          name: response.store.name,
          createdAt: response.store.created_at,
          ownerEmail: response.store.owner_email,
        }))
      );
  }

  deleteStore(storeId: string): Observable<void> {
    return this.edgeClient
      .callFunction<{ shop_id: string }, void>('admin_store_delete', { shop_id: storeId })
      .pipe(map(() => undefined));
  }

  updateLicense(
    licenseId: string,
    changes: {
      tier?: Tier;
      expiresAt?: string | null;
    }
  ): Observable<License> {
    const request: AdminLicenseUpdateRequest = {
      license_id: licenseId,
      tier: changes.tier,
      expires_at: changes.expiresAt,
    };

    return this.edgeClient
      .callFunction<AdminLicenseUpdateRequest, { license: any }>('admin_license_update', request)
      .pipe(
        map((response) => ({
          id: response.license.license_id ?? response.license.id,
          tier: response.license.tier as Tier,
          createdAt: response.license.created_at,
          expiresAt: response.license.expires_at ?? null,
          active:
            !response.license.expires_at ||
            new Date(response.license.expires_at) > new Date(),
        }))
      );
  }

  isAdmin(): Observable<boolean> {
    return this.listAllStores().pipe(
      map(() => true),
      catchError((error) => {
        if (error instanceof DomainError && error.type === 'Forbidden') {
          return of(false);
        }
        return of(false);
      })
    );
  }
}
