import { Observable } from 'rxjs';
import { Store } from '../models';

export interface StoresRepository {
  // List stores owned by the current user (RLS enforced)
  listMyStores(): Observable<Store[]>;
  getStore(domain: string): Observable<Store | null>;
  createStore(domain: string, name: string): Observable<Store>;
  updateStore(domain: string, changes: Partial<Store>): Observable<Store>;
  deleteStore(domain: string): Observable<void>;
}
