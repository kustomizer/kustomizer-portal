import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LicensesRepository } from '../../repositories/licenses.repository';
import { License } from '../../models';
import { LicenseStatus, Tier } from '../../types/enums';
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
          id,
          store_id,
          status,
          tier,
          limits,
          expires_at,
          created_at
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

  getLicenseByStore(storeId: string): Observable<License | null> {
    return from(
      this.supabaseClient.client
        .from('licenses')
        .select(
          `
          id,
          store_id,
          status,
          tier,
          limits,
          expires_at,
          created_at
        `
        )
        .eq('store_id', storeId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // 404 is acceptable
          if (error.code === 'PGRST116') {
            return null;
          }
          throw mapSupabaseErrorToDomainError(error);
        }
        return data ? this.mapToLicense(data) : null;
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  updateLicense(id: string, changes: Partial<License>): Observable<License> {
    const updateData: any = {};
    if (changes.status !== undefined) updateData.status = changes.status;
    if (changes.tier !== undefined) updateData.tier = changes.tier;
    if (changes.limits !== undefined) updateData.limits = changes.limits;
    if (changes.expiresAt !== undefined) updateData.expires_at = changes.expiresAt;

    return from(
      this.supabaseClient.client
        .from('licenses')
        .update(updateData)
        .eq('id', id)
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

  createLicense(storeId: string, license: Omit<License, 'id' | 'storeId'>): Observable<License> {
    return from(
      this.supabaseClient.client
        .from('licenses')
        .insert({
          store_id: storeId,
          status: license.status,
          tier: license.tier,
          limits: license.limits,
          expires_at: license.expiresAt || null,
        })
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

  updateTier(storeId: string, tier: Tier): Observable<License> {
    return from(
      this.supabaseClient.client
        .from('licenses')
        .update({ tier })
        .eq('store_id', storeId)
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

  private mapToLicense(row: any): License {
    return {
      id: row.id.toString(),
      storeId: row.store_id.toString(),
      status: row.status as LicenseStatus,
      tier: row.tier as Tier,
      limits: row.limits || {},
      expiresAt: row.expires_at || undefined,
      createdAt: row.created_at,
    };
  }
}

