import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedListarPacientes = vi.hoisted(() => vi.fn());
const mockedCriarPaciente = vi.hoisted(() => vi.fn());
const mockedEditarPaciente = vi.hoisted(() => vi.fn());
const mockedDeletarPaciente = vi.hoisted(() => vi.fn());

vi.mock('../../services/pacientes.service', () => ({
  listarPacientes: mockedListarPacientes,
  criarPaciente: mockedCriarPaciente,
  editarPaciente: mockedEditarPaciente,
  deletarPaciente: mockedDeletarPaciente,
}));

describe('/api/pacientes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockedListarPacientes.mockResolvedValue(undefined);
    mockedCriarPaciente.mockResolvedValue(undefined);
    mockedEditarPaciente.mockResolvedValue(undefined);
    mockedDeletarPaciente.mockResolvedValue(undefined);
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'OPTIONS' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
    expect(mockedListarPacientes).not.toHaveBeenCalled();
  });

  it('delega GET para listarPacientes', async () => {
    const { default: handler } = await import('./index');

    const { res } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedListarPacientes).toHaveBeenCalledTimes(1);
    expect(mockedListarPacientes).toHaveBeenCalledWith(req, res);
    expect(mockedCriarPaciente).not.toHaveBeenCalled();
    expect(mockedEditarPaciente).not.toHaveBeenCalled();
    expect(mockedDeletarPaciente).not.toHaveBeenCalled();
  });

  it('delega POST, PUT e DELETE para os metodos corretos', async () => {
    const { default: handler } = await import('./index');

    const post = createMockReq({ method: 'POST' });
    const put = createMockReq({ method: 'PUT' });
    const del = createMockReq({ method: 'DELETE' });

    await handler(post, createMockRes().res);
    await handler(put, createMockRes().res);
    await handler(del, createMockRes().res);

    expect(mockedCriarPaciente).toHaveBeenCalledWith(post, expect.anything());
    expect(mockedEditarPaciente).toHaveBeenCalledWith(put, expect.anything());
    expect(mockedDeletarPaciente).toHaveBeenCalledWith(del, expect.anything());
  });
});
