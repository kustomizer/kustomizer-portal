import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * SSR-safe storage service that wraps localStorage
 *
 * In SSR context, localStorage is not available. This service:
 * - Checks isPlatformBrowser before accessing localStorage
 * - Returns null/defaults when running server-side
 * - Prevents "localStorage is not defined" errors
 *
 * @see https://angular.dev/guide/ssr#using-browser-only-apis
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Get item from localStorage (SSR-safe)
   */
  getItem(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`StorageService: Failed to get item '${key}'`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage (SSR-safe)
   */
  setItem(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`StorageService: Failed to set item '${key}'`, error);
    }
  }

  /**
   * Remove item from localStorage (SSR-safe)
   */
  removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`StorageService: Failed to remove item '${key}'`, error);
    }
  }

  /**
   * Clear all items from localStorage (SSR-safe)
   */
  clear(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.warn('StorageService: Failed to clear storage', error);
    }
  }

  /**
   * Check if code is running in browser context
   */
  get canUseStorage(): boolean {
    return this.isBrowser;
  }
}

