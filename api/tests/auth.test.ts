import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq } from './http-mocks';

describe('auth utils', () => {
	beforeEach(() => {
		vi.resetModules();
		process.env.JWT_SECRET = 'test-secret';
		process.env.JWT_EXPIRES_IN = '1h';
	});

	it('gera e valida token JWT com payload esperado', async () => {
		const { gerarAccessToken, verificarAccessToken } = await import('../_lib/auth');

		const token = gerarAccessToken({
			id: 1,
			nome: 'Administrador',
			email: 'admin@teste.com',
			tipo_usuario: 'admin',
		});

		const payload = verificarAccessToken(token);

		expect(payload.id).toBe(1);
		expect(payload.sub).toBe('1');
		expect(payload.nome).toBe('Administrador');
		expect(payload.email).toBe('admin@teste.com');
		expect(payload.tipo_usuario).toBe('admin');
	});

	it('retorna erro ao extrair bearer token ausente', async () => {
		const { extrairBearerToken } = await import('../_lib/auth');

		expect(() => extrairBearerToken(undefined)).toThrow('Token nao enviado.');
	});

	it('retorna erro para formato de token invalido', async () => {
		const { extrairBearerToken } = await import('../_lib/auth');

		expect(() => extrairBearerToken('Basic abc')).toThrow('Formato do token invalido. Use: Bearer <token>.');
	});

	it('autentica requisicao a partir do header authorization', async () => {
		const { autenticarRequisicao, gerarAccessToken } = await import('../_lib/auth');

		const token = gerarAccessToken({
			id: 2,
			nome: 'Receptionista',
			email: 'recepcionista@teste.com',
			tipo_usuario: 'recepcionista',
		});

		const req = createMockReq({
			headers: {
				authorization: `Bearer ${token}`,
			},
		});

		const usuario = autenticarRequisicao(req);

		expect(usuario.id).toBe(2);
		expect(usuario.tipo_usuario).toBe('recepcionista');
	});

	it('autentica requisicao a partir do cookie de sessao', async () => {
		const { autenticarRequisicao, criarCookieSessao, gerarAccessToken } = await import('../_lib/auth');

		const token = gerarAccessToken({
			id: 3,
			nome: 'Admin Cookie',
			email: 'cookie@teste.com',
			tipo_usuario: 'admin',
		});

		const cookieHeader = criarCookieSessao(token).split(';')[0];

		const req = createMockReq({
			headers: {
				cookie: cookieHeader,
			},
		});

		const usuario = autenticarRequisicao(req);

		expect(usuario.id).toBe(3);
		expect(usuario.email).toBe('cookie@teste.com');
	});

	it('valida permissao de admin e acesso ao proprio usuario', async () => {
		const { verificarAdminAutorizado, verificarPermissaoAcesso } = await import('../_lib/auth');

		expect(() =>
			verificarAdminAutorizado({
				sub: '1',
				id: 1,
				nome: 'Administrador',
				email: 'admin@teste.com',
				tipo_usuario: 'admin',
			}),
		).not.toThrow();

		expect(() =>
			verificarPermissaoAcesso(
				{
					sub: '2',
					id: 2,
					nome: 'Recepcionista',
					email: 'recepcionista@teste.com',
					tipo_usuario: 'recepcionista',
				},
				2,
			),
		).not.toThrow();
	});

	it('nega acesso quando dentista/recepcionista tenta acessar outro usuario', async () => {
		const { verificarPermissaoAcesso } = await import('../_lib/auth');

		expect(() =>
			verificarPermissaoAcesso(
				{
					sub: '2',
					id: 2,
					nome: 'Recepcionista',
					email: 'recepcionista@teste.com',
					tipo_usuario: 'recepcionista',
				},
				99,
			),
		).toThrow('Acesso Restrito a Administradores.');
	});
});
