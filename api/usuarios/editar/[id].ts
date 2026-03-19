import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, verificarPermissaoAcesso } from '../../_lib/auth';
import pool from '../../_lib/db';
import { gerarSenhaHash } from '../../_lib/password';
import type { JwtUsuarioPayload, TipoUsuario, Usuario } from '../../_lib/types';

interface EditarUsuarioBody {
  nome?: string;
  email?: string;
  senha?: string;
  tipo_usuario?: TipoUsuario;
}

function extrairIdDaUrl(req: VercelRequest): number {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  const parsed = Number(id);

  if (!Number.isFinite(parsed)) {
    throw new AuthError('ID deve ser um numero valido.', 400);
  }

  return parsed;
}

function obterBody(req: VercelRequest): EditarUsuarioBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body) as EditarUsuarioBody;
  if (typeof req.body === 'object') return req.body as EditarUsuarioBody;
  return {};
}

async function editarUsuario(req: VercelRequest, id: number, res: VercelResponse, usuarioLogado: JwtUsuarioPayload) {
  try {
    verificarPermissaoAcesso(usuarioLogado, id);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
  }

  try {
    const body = obterBody(req);

    const campos: { chave: string; valor: unknown; isSenha: boolean }[] = [];

    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || !body.nome.trim()) {
        return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
      }
      campos.push({ chave: 'nome', valor: body.nome.trim(), isSenha: false });
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.includes('@')) {
        return res.status(400).json({ erro: 'Email invalido.' });
      }
      campos.push({ chave: 'email', valor: body.email.trim().toLowerCase(), isSenha: false });
    }

    if (body.tipo_usuario !== undefined) {
      if (usuarioLogado.tipo_usuario !== 'admin') {
        return res.status(403).json({ erro: 'Apenas administradores podem alterar tipo de usuario.' });
      }
      const tipo = (body.tipo_usuario as string).toLowerCase();
      if (tipo !== 'admin' && tipo !== 'operador') {
        return res.status(400).json({ erro: 'tipo_usuario deve ser "admin" ou "operador".' });
      }
      campos.push({ chave: 'tipo_usuario', valor: tipo, isSenha: false });
    }

    if (body.senha !== undefined) {
      if (typeof body.senha !== 'string') {
        return res.status(400).json({ erro: 'Senha deve ser uma string.' });
      }
      const senhaHash = await gerarSenhaHash(body.senha);
      campos.push({ chave: 'senha', valor: senhaHash, isSenha: true });
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
    }

    const setClauses = campos.map((c, i) => `${c.chave} = $${i + 1}`).join(', ');
    const valores = campos.map(c => c.valor);

    const resultado = await pool.query<Omit<Usuario, 'senha'>>(
      `UPDATE usuarios SET ${setClauses} WHERE id = $${campos.length + 1} RETURNING id, nome, email, tipo_usuario, criado_em`,
      [...valores, id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Usuario atualizado com sucesso.',
      usuario: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return res.status(409).json({ erro: 'Email ja existe.' });
      }
    }

    return res.status(500).json({ erro: 'Erro interno ao atualizar usuario.' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = extrairIdDaUrl(req);

    let usuarioLogado: JwtUsuarioPayload;
    try {
      usuarioLogado = autenticarRequisicao(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
      return res.status(401).json({ erro: 'Requer autenticacao.' });
    }

    if (req.method === 'PUT') {
      return await editarUsuario(req, id, res, usuarioLogado);
    }

    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ erro: 'Metodo nao permitido' });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
