import { Observable } from 'rxjs';
import { StoreUser } from '../models';
import { StoreUserRole, StoreUserStatus } from '../types/enums';

export interface StoreUsersRepository {
  listStoreUsers(domain: string): Observable<StoreUser[]>;

  inviteStoreUser(
    domain: string,
    email: string,
    role: StoreUserRole
  ): Observable<StoreUser>;

  updateStoreUserStatus(
    domain: string,
    email: string,
    status: StoreUserStatus
  ): Observable<StoreUser>;
}
