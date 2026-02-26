import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StoresRepository } from '../../repositories/stores.repository';
import { Store } from '../../models';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

type OwnerStoreConnectionRow = {
  shop_id: string;
  name: string | null;
  owner_email: string | null;
  shopify_domain: string | null;
  connected: boolean;
  last_validated_at: string | null;
};

type OwnerStoreConnectionsResponse = {
  connections?: OwnerStoreConnectionRow[];
};

type ShopRow = {
  id: string;
  shopify_domain: string;
  name: string;
  owner_email: string;
  created_at?: string;
};

function normalizeShopifyDomain(shopifyDomain: string): string {
  const raw = shopifyDomain.trim().toLowerCase();
  return raw.endsWith('.myshopify.com') ? raw : `${raw}.myshopify.com`;
}

function deriveStoreName(shopifyDomain: string): string {
  return normalizeShopifyDomain(shopifyDomain).replace(/\.myshopify\.com$/, '');
}

@Injectable()
export class SupabaseStoresRepository implements StoresRepository {
  private readonly supabaseClient = inject(SupabaseClientService);

  listMyStores(): Observable<Store[]> {
    return from(
      this.supabaseClient.client.functions.invoke<OwnerStoreConnectionsResponse>(
        'owner_store_connections_get',
        {
          body: {},
        }
      )
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }

        const rows = (data?.connections ?? []) as OwnerStoreConnectionRow[];
        return rows.map((row) => this.mapConnectionToStore(row));
      }),
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  getStore(storeId: string): Observable<Store | null> {
    return this.listMyStores().pipe(
      map((stores) => stores.find((store) => store.id === storeId) ?? null),
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  createStore(shopifyDomain: string, name: string): Observable<Store> {
    return from(this.createStoreInternal(shopifyDomain, name)).pipe(
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  updateStore(storeId: string, changes: Partial<Store>): Observable<Store> {
    const updateData: Record<string, unknown> = {};
    if (changes.name !== undefined) updateData['name'] = changes.name;
    if (changes.ownerEmail !== undefined) updateData['owner_email'] = changes.ownerEmail;
    if (changes.shopifyDomain !== undefined) {
      updateData['shopify_domain'] = normalizeShopifyDomain(changes.shopifyDomain);
    }

    return from(
      this.supabaseClient.client
        .from('shops')
        .update(updateData)
        .eq('id', storeId)
        .select('id, shopify_domain, name, owner_email, created_at')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          throw mapSupabaseErrorToDomainError(error ?? new Error('Failed to update store'));
        }
        return this.mapShopRowToStore(data as ShopRow);
      }),
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  deleteStore(storeId: string): Observable<void> {
    return from(this.supabaseClient.client.from('shops').delete().eq('id', storeId)).pipe(
      map(({ error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return undefined;
      }),
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  private async createStoreInternal(shopifyDomain: string, name: string): Promise<Store> {
    const user = await this.supabaseClient.getUser();
    const ownerEmail = user?.email?.toLowerCase();
    if (!ownerEmail) {
      throw mapSupabaseErrorToDomainError({ message: 'User email not available' });
    }

    const normalizedShopifyDomain = normalizeShopifyDomain(shopifyDomain);
    const derivedName = deriveStoreName(normalizedShopifyDomain);

    const { data: shop, error: shopError } = await this.supabaseClient.client
      .from('shops')
      .insert({
        shopify_domain: normalizedShopifyDomain,
        name: name || derivedName,
        owner_email: ownerEmail,
        allowed_domains: [derivedName, normalizedShopifyDomain],
      })
      .select('id, shopify_domain, name, owner_email, created_at')
      .single();

    if (shopError || !shop) {
      throw mapSupabaseErrorToDomainError(shopError ?? new Error('Failed to create shop'));
    }

    const { error: shopUserError } = await this.supabaseClient.client.from('shop_users').insert({
      shop_id: shop.id,
      email: ownerEmail,
      role: 'owner',
      status: 'active',
      invited_by: null,
    });

    if (shopUserError) {
      throw mapSupabaseErrorToDomainError(shopUserError);
    }

    return this.mapShopRowToStore(shop as ShopRow);
  }

  private mapShopRowToStore(row: ShopRow): Store {
    return {
      id: row.id,
      shopifyDomain: row.shopify_domain,
      name: row.name,
      ownerEmail: row.owner_email,
      createdAt: row.created_at,
      shopifyConnected: false,
      shopifyLastValidatedAt: null,
    };
  }

  private mapConnectionToStore(row: OwnerStoreConnectionRow): Store {
    const shopifyDomain = row.shopify_domain ? normalizeShopifyDomain(row.shopify_domain) : '';
    return {
      id: row.shop_id,
      shopifyDomain,
      name: row.name || deriveStoreName(shopifyDomain || row.shop_id),
      ownerEmail: row.owner_email ?? '',
      shopifyConnected: row.connected === true,
      shopifyLastValidatedAt: row.last_validated_at,
      createdAt: undefined,
    };
  }
}
