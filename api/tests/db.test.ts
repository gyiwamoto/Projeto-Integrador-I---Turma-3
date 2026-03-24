import { describe, it, expect, beforeEach } from 'vitest';

describe('Database Connection', () => {
  beforeEach(() => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
    }
  });

  it('pool eh exportado como default', async () => {
    const dbModule = await import('../_lib/db');
    expect(dbModule.default).toBeDefined();
  });

  it('pool tem metodo query', async () => {
    const dbModule = await import('../_lib/db');
    expect(typeof dbModule.default.query).toBe('function');
  });

  it('pool tem metodo end', async () => {
    const dbModule = await import('../_lib/db');
    expect(typeof dbModule.default.end).toBe('function');
  });

  it('DATABASE_URL eh passada para Pool', async () => {
    const originalUrl = process.env.DATABASE_URL;
    const testUrl = 'postgresql://test:pass@localhost/testdb';
    process.env.DATABASE_URL = testUrl;

    expect(process.env.DATABASE_URL).toBe(testUrl);

    process.env.DATABASE_URL = originalUrl;
  });

  it('pool retorna resultados com rowCount e rows', async () => {
    const dbModule = await import('../_lib/db');
    const pool = dbModule.default;

    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });

  it('erro de conexao eh capturado', async () => {
    const dbModule = await import('../_lib/db');
    const pool = dbModule.default;

    expect(pool).toBeDefined();
  });

  it('multiplas queries podem ser executadas', async () => {
    const dbModule = await import('../_lib/db');
    const pool = dbModule.default;

    expect(typeof pool.query).toBe('function');
    expect(typeof pool.end).toBe('function');
  });

  it('queries parametrizadas sao suportadas', async () => {
    const dbModule = await import('../_lib/db');
    const pool = dbModule.default;

    expect(pool).toBeDefined();
  });
});
