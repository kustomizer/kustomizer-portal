import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MockErrorService {
  private readonly storageKey = 'kustomizer.mock.failures';
  private failures = new Set<string>();

  constructor() {
    this.load();
  }

  shouldFail(key?: string): boolean {
    if (!key) {
      return false;
    }
    return this.failures.has(key);
  }

  enable(key: string): void {
    this.failures.add(key);
    this.save();
  }

  disable(key: string): void {
    this.failures.delete(key);
    this.save();
  }

  clear(): void {
    this.failures.clear();
    this.save();
  }

  list(): string[] {
    return Array.from(this.failures.values());
  }

  private load(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as string[];
      this.failures = new Set(parsed);
    } catch {
      this.failures = new Set();
    }
  }

  private save(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.list()));
  }
}
