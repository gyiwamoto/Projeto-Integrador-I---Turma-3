import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarProcedimentosRealizados = vi.hoisted(() => vi.fn());

vi.mock('../../services/procedimentosRealizados.service', () => ({
  listarProcedimentosRealizados: mockedListarProcedimentosRealizados,
}));

describe('/api/procedimentos-realizados', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarProcedimentosRealizados.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'PATCH' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
    expect(mockedListarProcedimentosRealizados).not.toHaveBeenCalled();
  });

  it('delega GET para listarProcedimentosRealizados', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedListarProcedimentosRealizados).toHaveBeenCalledTimes(1);
    expect(mockedListarProcedimentosRealizados).toHaveBeenCalledWith(req, res);
  });
});


