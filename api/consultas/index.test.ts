import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarConsultas = vi.hoisted(() => vi.fn());

vi.mock('../../services/consultas.service', () => ({
  listarConsultas: mockedListarConsultas,
}));

describe('/api/consultas', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarConsultas.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
    expect(mockedListarConsultas).not.toHaveBeenCalled();
  });

  it('delega GET para listarConsultas', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedListarConsultas).toHaveBeenCalledTimes(1);
    expect(mockedListarConsultas).toHaveBeenCalledWith(req, res);
  });
});
