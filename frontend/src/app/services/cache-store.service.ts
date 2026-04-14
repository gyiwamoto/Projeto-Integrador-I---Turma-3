import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheStoreService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs = 30 * 60 * 1000;

  getOrSet<T>(
    key: string,
    factory: () => Observable<T>,
    ttlMs = this.defaultTtlMs,
    forceRefresh = false,
  ): Observable<T> {
    // Se forçar refresh, invalida
    if (forceRefresh) {
      this.cache.delete(key);
    }

    // Se tem cache válido, retorna direto (sem concat - já retorna de cache e observable)
    const cached = this.getValid<T>(key);
    if (cached !== undefined) {
      return of(cached);
    }

    // Caso contrário, faz requisição e salva no cache
    return factory().pipe(
      tap((data) => {
        this.set(key, data, ttlMs);
      }),
    );
  }

  /**
   * Obtém valor válido (não expirado) do cache
   */
  private getValid<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    // Se expirou, remove e retorna undefined
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Obtém valor do cache (mesmo se expirado - "stale")
   */
  getSnapshot<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    return entry?.value;
  }

  /**
   * Define valor no cache com TTL
   */
  setSnapshot<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    this.set(key, value, ttlMs);
  }

  /**
   * Atualiza valor no cache via função updater
   */
  updateSnapshot<T>(key: string, updater: (current: T | undefined) => T): void {
    const atual = this.getSnapshot<T>(key);
    const proximo = updater(atual);
    this.setSnapshot(key, proximo);
  }

  /**
   * Remove valor do cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna todas as entradas (não filtra por prefixo - simplificado)
   */
  entriesByPrefix<T>(prefix: string): Array<{ key: string; value: T }> {
    const entries: Array<{ key: string; value: T }> = [];
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        entries.push({
          key,
          value: (entry as CacheEntry<T>).value,
        });
      }
    }
    return entries;
  }

  private set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}
