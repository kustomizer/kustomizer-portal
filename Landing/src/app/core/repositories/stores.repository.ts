import { Observable } from 'rxjs';
import { Store } from '../models';

export interface StoresRepository {
  // List stores owned by the current user (RLS enforced)
  listMyStores(): Observable<Store[]>;
  getStore(storeId: string): Observable<Store | null>;
  createStore(shopifyDomain: string, name: string): Observable<Store>;
  updateStore(storeId: string, changes: Partial<Store>): Observable<Store>;
  deleteStore(storeId: string): Observable<void>;
}
