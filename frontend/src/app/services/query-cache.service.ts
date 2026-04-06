import { Injectable } from '@angular/core';
import { Observable, defer, of, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';

interface CacheEntry<T> {
  expiresAt: number;
  value$: Observable<T>;
  snapshot?: T;
}

@Injectable({
  providedIn: 'root',
})
export class QueryCacheService {
  private readonly defaultTtlMs = 30 * 60 * 1000;
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  getOrSet<T>(
    key: string,
    factory: () => Observable<T>,
    ttlMs = this.defaultTtlMs,
    forceRefresh = false,
  ): Observable<T> {
    const now = Date.now();
    const existing = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!forceRefresh && existing && existing.expiresAt > now) {
      return existing.value$;
    }

    const value$ = defer(factory).pipe(
      tap((value) => {
        const current = this.cache.get(key) as CacheEntry<T> | undefined;
        if (current) {
          current.snapshot = value;
          current.expiresAt = Date.now() + ttlMs;
        }
      }),
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(key, {
      expiresAt: now + ttlMs,
      value$,
      snapshot: existing?.snapshot,
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

  getSnapshot<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    return entry?.snapshot;
  }

  setSnapshot<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    const value$ = of(value).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.cache.set(key, {
      expiresAt: Date.now() + ttlMs,
      value$,
      snapshot: value,
    });
  }

  updateSnapshot<T>(key: string, updater: (current: T | undefined) => T): void {
    const nextValue = updater(this.getSnapshot<T>(key));
    this.setSnapshot(key, nextValue);
  }

  clear(): void {
    this.cache.clear();
  }
}
