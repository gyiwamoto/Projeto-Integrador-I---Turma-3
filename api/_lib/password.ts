import bcrypt from 'bcryptjs';

function parseSaltRounds(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 4 || parsed > 15) {
    return fallback;
  }

  return parsed;
}

const saltRounds = parseSaltRounds(process.env.BCRYPT_SALT_ROUNDS, 12);

export async function gerarSenhaHash(senha: string): Promise<string> {
  if (!senha || senha.trim().length < 6) {
    throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  }

  return bcrypt.hash(senha, saltRounds);
}

export async function validarSenha(senhaTexto: string, senhaHash: string): Promise<boolean> {
  if (!senhaTexto || !senhaHash) {
    return false;
  }

  return bcrypt.compare(senhaTexto, senhaHash);
}
