import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MembershipsRepository } from '../../repositories/memberships.repository';
import { Membership } from '../../models';
import { MembershipRole, MembershipStatus } from '../../types/enums';
import {
  SendInvitationRequest,
  SendInvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from '../../types/edge-functions';
import { EdgeClientService } from './edge-client.service';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { mapSupabaseErrorToDomainError } from '../supabase/error-mapper';

@Injectable()
export class EdgeMembershipsRepository implements MembershipsRepository {
  private readonly edgeClient = inject(EdgeClientService);
  private readonly supabaseClient = inject(SupabaseClientService);

  listMembers(storeId: string): Observable<Membership[]> {
    // Read directly from Supabase with RLS
    return from(
      this.supabaseClient.client
        .from('memberships')
        .select(
          `
          id,
          store_id,
          user_id,
          email,
          role,
          status,
          membership_key,
          expires_at,
          accepted_at,
          created_at
        `
        )
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToMembership(row));
      })
    );
  }

  listMembershipsForUser(userId: string): Observable<Membership[]> {
    return from(
      this.supabaseClient.client
        .from('memberships')
        .select(
          `
          id,
          store_id,
          user_id,
          email,
          role,
          status,
          membership_key,
          expires_at,
          accepted_at,
          created_at
        `
        )
        .eq('user_id', userId)
        .eq('status', MembershipStatus.Active)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToMembership(row));
      })
    );
  }

  sendInvitation(
    storeId: string,
    email: string,
    role: MembershipRole,
    expiresInDays?: number
  ): Observable<{ inviteUrl: string; membershipKey: string }> {
    const request: SendInvitationRequest = {
      store_id: storeId,
      email,
      role,
      expires_in_days: expiresInDays,
    };

    return this.edgeClient
      .callFunction<SendInvitationRequest, SendInvitationResponse>('send_invitation', request)
      .pipe(
        map((response) => ({
          inviteUrl: response.invite_url,
          membershipKey: response.membership_key,
        }))
      );
  }

  acceptInvitation(membershipKey: string): Observable<Membership> {
    const request: AcceptInvitationRequest = {
      membership_key: membershipKey,
    };

    return this.edgeClient
      .callFunction<AcceptInvitationRequest, AcceptInvitationResponse>('accept_invitation', request)
      .pipe(
        switchMap((response) => {
          // Fetch the full membership details after acceptance
          return from(
            this.supabaseClient.client
              .from('memberships')
              .select('*')
              .eq('id', response.membership_id)
              .single()
          ).pipe(
            map(({ data, error }) => {
              if (error) {
                throw mapSupabaseErrorToDomainError(error);
              }
              return this.mapToMembership(data);
            })
          );
        })
      );
  }

  removeMembership(membershipId: string): Observable<void> {
    // This could be an Edge Function call or direct Supabase update
    return from(
      this.supabaseClient.client
        .from('memberships')
        .update({ status: MembershipStatus.Revoked })
        .eq('id', membershipId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return undefined;
      })
    );
  }

  updateMembershipRole(membershipId: string, role: MembershipRole): Observable<Membership> {
    return from(
      this.supabaseClient.client
        .from('memberships')
        .update({ role })
        .eq('id', membershipId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return this.mapToMembership(data);
      })
    );
  }

  private mapToMembership(row: any): Membership {
    return {
      id: row.id.toString(),
      storeId: row.store_id.toString(),
      userId: row.user_id || '',
      email: row.email,
      role: row.role as MembershipRole,
      status: row.status as MembershipStatus,
      membershipKey: row.membership_key,
      expiresAt: row.expires_at || undefined,
      acceptedAt: row.accepted_at || undefined,
      createdAt: row.created_at,
    };
  }
}

