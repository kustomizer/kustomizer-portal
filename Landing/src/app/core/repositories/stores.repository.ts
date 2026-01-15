import { Observable } from 'rxjs';
import { Store } from '../models';

export interface StoresRepository {
  listStores(orgId: string): Observable<Store[]>;
  getStore(id: string): Observable<Store | null>;
  createStore(orgId: string, store: Omit<Store, 'id' | 'orgId' | 'createdAt'>): Observable<Store>;
  updateStore(id: string, changes: Partial<Store>): Observable<Store>;
  deleteStore(id: string): Observable<void>;
}
