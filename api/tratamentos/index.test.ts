import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarTratamentos = vi.hoisted(() => vi.fn());
const mockedCriarTratamento = vi.hoisted(() => vi.fn());
const mockedEditarTratamento = vi.hoisted(() => vi.fn());
const mockedDeletarTratamento = vi.hoisted(() => vi.fn());

vi.mock('../../services/tratamentos.service', () => ({
  listarTratamentos: mockedListarTratamentos,
  criarTratamento: mockedCriarTratamento,
  editarTratamento: mockedEditarTratamento,
  deletarTratamento: mockedDeletarTratamento,
}));

describe('/api/tratamentos', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarTratamentos.mockResolvedValue(undefined);
    mockedCriarTratamento.mockResolvedValue(undefined);
    mockedEditarTratamento.mockResolvedValue(undefined);
    mockedDeletarTratamento.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
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

  it('delega POST para criarTratamento', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(mockedCriarTratamento).toHaveBeenCalledTimes(1);
    expect(mockedCriarTratamento).toHaveBeenCalledWith(req, res);
  });

  it('delega PUT para editarTratamento', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'PUT' });

    await handler(req, res);

    expect(mockedEditarTratamento).toHaveBeenCalledTimes(1);
    expect(mockedEditarTratamento).toHaveBeenCalledWith(req, res);
  });

  it('delega DELETE para deletarTratamento', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'DELETE' });

    await handler(req, res);

    expect(mockedDeletarTratamento).toHaveBeenCalledTimes(1);
    expect(mockedDeletarTratamento).toHaveBeenCalledWith(req, res);
  });
});
