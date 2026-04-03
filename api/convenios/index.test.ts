import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarConvenios = vi.hoisted(() => vi.fn());
const mockedCriarConvenio = vi.hoisted(() => vi.fn());
const mockedEditarConvenio = vi.hoisted(() => vi.fn());
const mockedDeletarConvenio = vi.hoisted(() => vi.fn());

vi.mock('../../services/convenios.service', () => ({
  listarConvenios: mockedListarConvenios,
  criarConvenio: mockedCriarConvenio,
  editarConvenio: mockedEditarConvenio,
  deletarConvenio: mockedDeletarConvenio,
}));

describe('/api/convenios', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarConvenios.mockResolvedValue(undefined);
    mockedCriarConvenio.mockResolvedValue(undefined);
    mockedEditarConvenio.mockResolvedValue(undefined);
    mockedDeletarConvenio.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
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

  it('delega POST para criarConvenio', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(mockedCriarConvenio).toHaveBeenCalledTimes(1);
    expect(mockedCriarConvenio).toHaveBeenCalledWith(req, res);
  });

  it('delega PUT para editarConvenio', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'PUT' });

    await handler(req, res);

    expect(mockedEditarConvenio).toHaveBeenCalledTimes(1);
    expect(mockedEditarConvenio).toHaveBeenCalledWith(req, res);
  });

  it('delega DELETE para deletarConvenio', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'DELETE' });

    await handler(req, res);

    expect(mockedDeletarConvenio).toHaveBeenCalledTimes(1);
    expect(mockedDeletarConvenio).toHaveBeenCalledWith(req, res);
  });
});
