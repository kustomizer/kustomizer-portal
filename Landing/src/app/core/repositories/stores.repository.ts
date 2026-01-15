import { Observable } from 'rxjs';
import { Store } from '../models';

export interface StoresRepository {
  // List stores where current user has membership (RLS enforced)
  listMyStores(): Observable<Store[]>;
  getStore(id: string): Observable<Store | null>;
  createStore(name: string, metadata?: Record<string, any>): Observable<Store>;
  updateStore(id: string, changes: Partial<Store>): Observable<Store>;
  deleteStore(id: string): Observable<void>;
}
