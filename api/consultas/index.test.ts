import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarConsultas = vi.hoisted(() => vi.fn());
const mockedCriarConsulta = vi.hoisted(() => vi.fn());
const mockedAtualizarStatusConsulta = vi.hoisted(() => vi.fn());
const mockedExcluirConsulta = vi.hoisted(() => vi.fn());

vi.mock('../../services/consultas.service', () => ({
  listarConsultas: mockedListarConsultas,
  criarConsulta: mockedCriarConsulta,
  atualizarStatusConsulta: mockedAtualizarStatusConsulta,
  excluirConsulta: mockedExcluirConsulta,
}));

describe('/api/consultas', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockedListarConsultas.mockResolvedValue(undefined);
    mockedCriarConsulta.mockResolvedValue(undefined);
    mockedAtualizarStatusConsulta.mockResolvedValue(undefined);
    mockedExcluirConsulta.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'PATCH' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
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

  it('delega POST para criarConsulta', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(mockedCriarConsulta).toHaveBeenCalledTimes(1);
    expect(mockedCriarConsulta).toHaveBeenCalledWith(req, res);
  });

  it('delega PUT para atualizarStatusConsulta', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'PUT' });

    await handler(req, res);

    expect(mockedAtualizarStatusConsulta).toHaveBeenCalledTimes(1);
    expect(mockedAtualizarStatusConsulta).toHaveBeenCalledWith(req, res);
  });

  it('delega DELETE para excluirConsulta', async () => {
    const { default: handler } = await import('./index');
    const { res } = createMockRes();
    const req = createMockReq({ method: 'DELETE' });

    await handler(req, res);

    expect(mockedExcluirConsulta).toHaveBeenCalledTimes(1);
    expect(mockedExcluirConsulta).toHaveBeenCalledWith(req, res);
  });
});


