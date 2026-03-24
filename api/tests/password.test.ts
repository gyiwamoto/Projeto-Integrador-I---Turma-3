import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('password utils', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('gera hash e valida senha corretamente', async () => {
		const { gerarSenhaHash, validarSenha } = await import('../_lib/password');

		const senha = 'senhaForte123';
		const hash = await gerarSenhaHash(senha);

		expect(hash).not.toBe(senha);
		await expect(validarSenha(senha, hash)).resolves.toBe(true);
	});

	it('retorna false para senha incorreta', async () => {
		const { gerarSenhaHash, validarSenha } = await import('../_lib/password');

		const hash = await gerarSenhaHash('senhaForte123');

		await expect(validarSenha('outraSenha', hash)).resolves.toBe(false);
	});

	it('retorna false quando senha ou hash estao ausentes', async () => {
		const { validarSenha } = await import('../_lib/password');

		await expect(validarSenha('', 'hash')).resolves.toBe(false);
		await expect(validarSenha('senha', '')).resolves.toBe(false);
	});

	it('lanca erro para senha curta ao gerar hash', async () => {
		const { gerarSenhaHash } = await import('../_lib/password');

		await expect(gerarSenhaHash('123')).rejects.toThrow('A senha precisa ter pelo menos 6 caracteres.');
	});
});
