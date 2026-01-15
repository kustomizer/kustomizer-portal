import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BootstrapRepository, BootstrapResponse } from '../../repositories/bootstrap.repository';
import { Tier } from '../../types/enums';
import { BootstrapNewUserRequest, BootstrapNewUserResponse } from '../../types/edge-functions';
import { EdgeClientService } from './edge-client.service';

@Injectable()
export class EdgeBootstrapRepository implements BootstrapRepository {
  private readonly edgeClient = inject(EdgeClientService);

  bootstrapNewUser(storeName: string, tier: Tier): Observable<BootstrapResponse> {
    const request: BootstrapNewUserRequest = {
      store_name: storeName,
      tier: tier,
    };

    return this.edgeClient
      .callFunction<BootstrapNewUserRequest, BootstrapNewUserResponse>(
        'bootstrap_new_user',
        request
      )
      .pipe(
        map((response) => ({
          storeId: response.store_id,
          licenseId: response.license_id,
          membershipId: response.membership_id,
        }))
      );
  }
}

