import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {
  private isBrowser: boolean = false;
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  setItem(key: string, value: any): void {
    if (this.isBrowser) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getItem<T>(key: string): T | null {
    if (this.isBrowser) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
    return null;
  }

  removeItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.isBrowser) {
          localStorage.clear();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
