import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedDb = vi.hoisted(() => ({ query: vi.fn() }));
const mockedAutenticarRequisicao = vi.hoisted(() => vi.fn());

vi.mock('../_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../_lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../_lib/auth')>('../_lib/auth');

  return {
    ...actual,
    autenticarRequisicao: mockedAutenticarRequisicao,
  };
});

describe('/api/usuarios', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'OPTIONS' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
  });

  it('retorna 403 para usuario recepcionista/dentista', async () => {
    const { default: handler } = await import('./index');

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '2',
      id: 2,
      nome: 'Dentista',
      email: 'dentista@teste.com',
      tipo_usuario: 'dentista',
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(403);
    expect(state.jsonBody).toEqual({ erro: 'Acesso Restrito a Administradores.' });
    expect(mockedDb.query).not.toHaveBeenCalled();
  });

  it('retorna lista de usuarios para admin', async () => {
    const { default: handler } = await import('./index');

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: 1,
      nome: 'Administrador',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    mockedDb.query.mockResolvedValue({
      rowCount: 3,
      rows: [
        {
          id: 1,
          nome: 'Administrador',
          email: 'admin@teste.com',
          tipo_usuario: 'admin',
          criado_em: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          nome: 'Dentista',
          email: 'dentista@teste.com',
          tipo_usuario: 'dentista',
          criado_em: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 3,
          nome: 'Recepcionista',
          email: 'recepcionista@teste.com',
          tipo_usuario: 'recepcionista',
          criado_em: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedDb.query).toHaveBeenCalledWith(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios ORDER BY id',
    );
    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      total: 3,
      usuarios: [
        {
          id: 1,
          nome: 'Administrador',
          email: 'admin@teste.com',
          tipo_usuario: 'admin',
          criado_em: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          nome: 'Dentista',
          email: 'dentista@teste.com',
          tipo_usuario: 'dentista',
          criado_em: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 3,
          nome: 'Recepcionista',
          email: 'recepcionista@teste.com',
          tipo_usuario: 'recepcionista',
          criado_em: '2026-01-02T00:00:00.000Z',
        }
      ],
    });
  });
});
