import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreUsersRepository } from '../../repositories/store-users.repository';
import { StoreUser } from '../../models';
import { StoreUserRole, StoreUserStatus } from '../../types/enums';
import {
  InviteStoreUserRequest,
  InviteStoreUserResponse,
  RemoveStoreUserRequest,
} from '../../types/edge-functions';
import { EdgeClientService } from './edge-client.service';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { mapSupabaseErrorToDomainError } from '../supabase/error-mapper';

@Injectable()
export class EdgeStoreUsersRepository implements StoreUsersRepository {
  private readonly edgeClient = inject(EdgeClientService);
  private readonly supabaseClient = inject(SupabaseClientService);

  listStoreUsers(shopId: string): Observable<StoreUser[]> {
    return from(
      this.supabaseClient.client
        .from('shop_users')
        .select(
          `
          shop_id,
          email,
          invited_by,
          role,
          status,
          created_at
        `
        )
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToStoreUser(row));
      })
    );
  }

  inviteStoreUser(shopId: string, email: string, role: StoreUserRole): Observable<StoreUser> {
    const request: InviteStoreUserRequest = {
      shop_id: shopId,
      email,
      role,
    };

    return this.edgeClient
      .callFunction<InviteStoreUserRequest, InviteStoreUserResponse>('invite_store_user', request)
      .pipe(
        map((response) => ({
          shopId: response.shop_id,
          email: response.email,
          invitedBy: null,
          role: response.role as StoreUserRole,
          status: response.status as StoreUserStatus,
        }))
      );
  }

  updateStoreUserStatus(shopId: string, email: string, status: StoreUserStatus): Observable<StoreUser> {
    if (status !== StoreUserStatus.Removed) {
      throw new Error('Only removal is supported via Edge for now');
    }

    const request: RemoveStoreUserRequest = {
      shop_id: shopId,
      email,
    };

    return this.edgeClient
      .callFunction<RemoveStoreUserRequest, InviteStoreUserResponse>('remove_store_user', request)
      .pipe(
        map((response) => ({
          shopId: response.shop_id,
          email: response.email,
          invitedBy: null,
          role: response.role as StoreUserRole,
          status: response.status as StoreUserStatus,
        }))
      );
  }

  private mapToStoreUser(row: any): StoreUser {
    return {
      shopId: row.shop_id,
      email: row.email,
      invitedBy: row.invited_by ?? null,
      role: row.role as StoreUserRole,
      status: row.status as StoreUserStatus,
      createdAt: row.created_at,
    };
  }
}
