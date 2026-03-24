import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarConvenios = vi.hoisted(() => vi.fn());

vi.mock('../../services/convenios.service', () => ({
  listarConvenios: mockedListarConvenios,
}));

describe('/api/convenios', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarConvenios.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
    expect(mockedListarConvenios).not.toHaveBeenCalled();
  });

  it('delega GET para listarConvenios', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedListarConvenios).toHaveBeenCalledTimes(1);
    expect(mockedListarConvenios).toHaveBeenCalledWith(req, res);
  });
});
