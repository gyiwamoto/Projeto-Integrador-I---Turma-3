import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarTratamentos = vi.hoisted(() => vi.fn());

vi.mock('../../services/tratamentos.service', () => ({
  listarTratamentos: mockedListarTratamentos,
}));

describe('/api/tratamentos', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarTratamentos.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
    expect(mockedListarTratamentos).not.toHaveBeenCalled();
  });

  it('delega GET para listarTratamentos', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedListarTratamentos).toHaveBeenCalledTimes(1);
    expect(mockedListarTratamentos).toHaveBeenCalledWith(req, res);
  });
});
