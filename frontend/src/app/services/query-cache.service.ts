import { Injectable } from '@angular/core';
import { Observable, defer, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

interface CacheEntry<T> {
  expiresAt: number;
  value$: Observable<T>;
}

@Injectable({
  providedIn: 'root',
})
export class QueryCacheService {
  private readonly defaultTtlMs = 30 * 60 * 1000;
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  getOrSet<T>(key: string, factory: () => Observable<T>, ttlMs = this.defaultTtlMs): Observable<T> {
    const now = Date.now();
    const existing = this.cache.get(key) as CacheEntry<T> | undefined;

    if (existing && existing.expiresAt > now) {
      return existing.value$;
    }

    const value$ = defer(factory).pipe(
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(key, {
      expiresAt: now + ttlMs,
      value$,
    });

    return value$;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
