import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from './http-mocks';

const mockedDb = vi.hoisted(() => ({ query: vi.fn() }));
const mockedValidarSenha = vi.hoisted(() => vi.fn());

vi.mock('../../api/_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../../api/_lib/password', () => ({
  validarSenha: mockedValidarSenha,
}));

describe('services/auth.service logs', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  it('registra log de sucesso no login', async () => {
    const { autenticarLogin } = await import('../../services/auth.service');

    mockedDb.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 1,
            nome: 'Administrador',
            email: 'admin@teste.com',
            senha_hash: 'hash',
            tipo_usuario: 'admin',
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    mockedValidarSenha.mockResolvedValue(true);

    const req = createMockReq({
      method: 'POST',
      url: '/api/auth',
      headers: {
        'x-forwarded-for': '200.10.1.2, 10.0.0.1',
        'user-agent': 'Vitest',
      },
      body: {
        email: 'admin@teste.com',
        senha: '123456',
      },
    });
    const { res, state } = createMockRes();

    await autenticarLogin(req, res);

    expect(state.statusCode).toBe(200);
    expect(mockedDb.query).toHaveBeenCalledTimes(2);
    expect(mockedDb.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO logs_acessos'),
      [
        1,
        'admin@teste.com',
        '200.10.1.2',
        'Vitest',
        '/api/auth',
        'POST',
        200,
        true,
        'Login realizado com sucesso.',
      ],
    );
  });

  it('registra log de falha quando credenciais sao invalidas', async () => {
    const { autenticarLogin } = await import('../../services/auth.service');

    mockedDb.query
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const req = createMockReq({
      method: 'POST',
      url: '/api/auth',
      headers: {
        'x-forwarded-for': '177.20.2.10',
        'user-agent': 'Vitest',
      },
      body: {
        email: 'inexistente@teste.com',
        senha: 'senha-errada',
      },
    });
    const { res, state } = createMockRes();

    await autenticarLogin(req, res);

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({ erro: 'Credenciais invalidas.' });
    expect(mockedDb.query).toHaveBeenCalledTimes(2);
    expect(mockedDb.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO logs_acessos'),
      [
        null,
        'inexistente@teste.com',
        '177.20.2.10',
        'Vitest',
        '/api/auth',
        'POST',
        401,
        false,
        'Credenciais invalidas.',
      ],
    );
  });

  it('registra log no logout mesmo sem token valido', async () => {
    const { logout } = await import('../../services/auth.service');

    mockedDb.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const req = createMockReq({
      method: 'DELETE',
      url: '/api/auth',
      headers: {
        'user-agent': 'Vitest',
      },
    });
    const { res, state } = createMockRes();

    await logout(req, res);

    expect(state.statusCode).toBe(200);
    expect(mockedDb.query).toHaveBeenCalledTimes(1);
    expect(mockedDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO logs_acessos'),
      [
        null,
        null,
        null,
        'Vitest',
        '/api/auth',
        'DELETE',
        200,
        true,
        'Logout realizado com sucesso.',
      ],
    );
  });
});


