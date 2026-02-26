import { Observable } from 'rxjs';
import { StoreUser } from '../models';
import { StoreUserRole, StoreUserStatus } from '../types/enums';

export interface StoreUsersRepository {
  listStoreUsers(shopId: string): Observable<StoreUser[]>;

  inviteStoreUser(
    shopId: string,
    email: string,
    role: StoreUserRole
  ): Observable<StoreUser>;

  updateStoreUserStatus(
    shopId: string,
    email: string,
    status: StoreUserStatus
  ): Observable<StoreUser>;
}
