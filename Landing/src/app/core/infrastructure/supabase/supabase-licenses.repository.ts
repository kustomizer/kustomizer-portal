import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { LicensesRepository } from '../../repositories/licenses.repository';
import { License } from '../../models';
import { Tier } from '../../types/enums';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

@Injectable()
export class SupabaseLicensesRepository implements LicensesRepository {
  private readonly supabaseClient = inject(SupabaseClientService);

  listLicenses(): Observable<License[]> {
    return from(
      this.supabaseClient.client
        .from('licenses')
        .select(
          `
          license_id,
          tier,
          created_at,
          expires_at
        `
        )
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToLicense(row));
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  getLicenseByStore(domain: string): Observable<License | null> {
    return from(
      this.supabaseClient.client
        .from('stores')
        .select('domain, owner_id')
        .eq('domain', domain)
        .single()
    ).pipe(
      switchMap(({ data: store, error: storeError }) => {
        if (storeError) {
          if (storeError.code === 'PGRST116') {
            return from(Promise.resolve({ data: null, error: null }));
          }
          throw mapSupabaseErrorToDomainError(storeError);
        }
        if (!store?.owner_id) {
          return from(Promise.resolve({ data: null, error: null }));
        }
        return from(
          this.supabaseClient.client
            .from('users')
            .select('license_id')
            .eq('email', store.owner_id)
            .single()
        ).pipe(
          switchMap(({ data: userRow, error: userError }) => {
            if (userError || !userRow?.license_id) {
              return from(Promise.resolve({ data: null, error: null }));
            }
            return from(
              this.supabaseClient.client
                .from('licenses')
                .select('license_id, tier, created_at, expires_at')
                .eq('license_id', userRow.license_id)
                .single()
            );
          })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          throw mapSupabaseErrorToDomainError(error);
        }
        return data ? this.mapToLicense(data) : null;
      }),
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  updateLicense(id: string, changes: Partial<License>): Observable<License> {
    const updateData: any = {};
    if (changes.tier !== undefined) updateData.tier = changes.tier;
    if (changes.expiresAt !== undefined) updateData.expires_at = changes.expiresAt;

    return from(
      this.supabaseClient.client
        .from('licenses')
        .update(updateData)
        .eq('license_id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return this.mapToLicense(data);
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  updateTier(licenseId: string, tier: Tier): Observable<License> {
    return from(
      this.supabaseClient.client
        .from('licenses')
        .update({ tier })
        .eq('license_id', licenseId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return this.mapToLicense(data);
      }),
      catchError((error) => throwError(() => mapSupabaseErrorToDomainError(error)))
    );
  }

  private mapToLicense(row: any): License {
    return {
      id: row.license_id,
      tier: row.tier as Tier,
      createdAt: row.created_at,
      expiresAt: row.expires_at ?? null,
      active: !row.expires_at || new Date(row.expires_at) > new Date(),
    };
  }
}
