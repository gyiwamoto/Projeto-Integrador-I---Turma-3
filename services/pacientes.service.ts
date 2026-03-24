import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, verificarPermissaoDeletar } from '../api/_lib/auth';
import pool from '../api/_lib/db';
import { registrarLogFalha, registrarLogSucesso } from './logsAcessos.service';

interface PacienteListagem {
  id: string;
  codigo_paciente: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  whatsapp_push: boolean;
  email: string | null;
  convenio_id: string | null;
  convenio_nome: string | null;
  numero_carteirinha: string | null;
  criado_em: string;
}

interface Paciente extends PacienteListagem {}

interface CriarPacienteBody {
  nome?: string;
  data_nascimento?: string;
  telefone?: string;
  whatsapp_push?: boolean;
  email?: string;
  convenio_id?: string;
  numero_carteirinha?: string;
}

interface EditarPacienteBody {
  codigo_paciente?: string;
  nome?: string;
  data_nascimento?: string;
  telefone?: string;
  whatsapp_push?: boolean;
  email?: string;
  convenio_id?: string;
  numero_carteirinha?: string;
}

function extrairIdDaUrl(req: VercelRequest): string {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  return id;
}

export async function listarPacientes(req: VercelRequest, res: VercelResponse) {
  try {
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<PacienteListagem>(
    `SELECT p.id,
            p.codigo_paciente,
            p.nome,
            p.data_nascimento,
            p.telefone,
            p.whatsapp_push,
            p.email,
            p.convenio_id,
            c.nome AS convenio_nome,
            p.numero_carteirinha,
            p.criado_em
       FROM pacientes p
       LEFT JOIN convenios c ON c.id = p.convenio_id
      ORDER BY p.criado_em DESC`,
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    pacientes: resultado.rows,
  });
}

export async function criarPaciente(req: VercelRequest, res: VercelResponse) {
  let usuarioId: number | string | null = null;
  let emailInformado: string | undefined;

  try {
    const usuarioLogado = autenticarRequisicao(req);
    usuarioId = usuarioLogado.id;
    emailInformado = usuarioLogado.email;
  } catch (error) {
    if (error instanceof AuthError) {
      await registrarLogFalha({
        req,
        statusHttp: error.statusCode,
        mensagem: error.message,
        rotaPadrao: '/api/pacientes',
      });

      return res.status(error.statusCode).json({ erro: error.message });
    }

    await registrarLogFalha({
      req,
      statusHttp: 401,
      mensagem: 'Requer autenticacao.',
      rotaPadrao: '/api/pacientes',
    });

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as CriarPacienteBody);

    if ((body as { codigo_paciente?: unknown }).codigo_paciente !== undefined) {
      await registrarLogFalha({
        req,
        usuarioId,
        emailInformado,
        statusHttp: 400,
        mensagem: 'codigo_paciente eh gerado automaticamente e nao deve ser enviado.',
        rotaPadrao: '/api/pacientes',
      });

      return res.status(400).json({ erro: 'codigo_paciente eh gerado automaticamente e nao deve ser enviado.' });
    }

    if (typeof body.nome !== 'string' || !body.nome.trim()) {
      await registrarLogFalha({
        req,
        usuarioId,
        emailInformado,
        statusHttp: 400,
        mensagem: 'Nome do paciente eh obrigatorio.',
        rotaPadrao: '/api/pacientes',
      });

      return res.status(400).json({ erro: 'Nome do paciente eh obrigatorio.' });
    }

    const nome = body.nome.trim();
    const dataNascimento = body.data_nascimento ? String(body.data_nascimento).trim() : null;
    const telefone = body.telefone ? String(body.telefone).trim() : null;
    const whatsappPush = Boolean(body.whatsapp_push);
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const convenioId = body.convenio_id ? String(body.convenio_id).trim() : null;
    const numeroCarteirinha = body.numero_carteirinha ? String(body.numero_carteirinha).trim() : null;

    const resultado = await pool.query<Paciente>(
      `INSERT INTO pacientes
        (nome, data_nascimento, telefone, whatsapp_push, email, convenio_id, numero_carteirinha)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id,
                codigo_paciente,
                nome,
                data_nascimento,
                telefone,
                whatsapp_push,
                email,
                convenio_id,
                NULL::TEXT AS convenio_nome,
                numero_carteirinha,
                criado_em`,
      [nome, dataNascimento, telefone, whatsappPush, email, convenioId, numeroCarteirinha],
    );

    if (resultado.rowCount !== 1) {
      await registrarLogFalha({
        req,
        usuarioId,
        emailInformado,
        statusHttp: 500,
        mensagem: 'Erro ao criar paciente.',
        rotaPadrao: '/api/pacientes',
      });

      return res.status(500).json({ erro: 'Erro ao criar paciente.' });
    }

    await registrarLogSucesso({
      req,
      usuarioId,
      emailInformado,
      statusHttp: 201,
      mensagem: 'Paciente criado com sucesso.',
      rotaPadrao: '/api/pacientes',
    });

    return res.status(201).json({
      mensagem: 'Paciente criado com sucesso.',
      codigo_paciente: resultado.rows[0].codigo_paciente,
      paciente: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      await registrarLogFalha({
        req,
        usuarioId,
        emailInformado,
        statusHttp: 400,
        mensagem: 'Corpo da requisicao invalido.',
        rotaPadrao: '/api/pacientes',
      });

      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof Error && error.message.includes('unique constraint')) {
      await registrarLogFalha({
        req,
        usuarioId,
        emailInformado,
        statusHttp: 409,
        mensagem: 'Codigo de paciente ou email ja cadastrado.',
        rotaPadrao: '/api/pacientes',
      });

      return res.status(409).json({ erro: 'Codigo de paciente ou email ja cadastrado.' });
    }

    await registrarLogFalha({
      req,
      usuarioId,
      emailInformado,
      statusHttp: 500,
      mensagem: 'Erro interno ao criar paciente.',
      rotaPadrao: '/api/pacientes',
    });

    return res.status(500).json({ erro: 'Erro interno ao criar paciente.' });
  }
}

export async function editarPaciente(req: VercelRequest, res: VercelResponse) {
  let id: string;
  try {
    id = extrairIdDaUrl(req);
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as EditarPacienteBody);

    if (body.codigo_paciente !== undefined) {
      return res.status(400).json({ erro: 'codigo_paciente nao pode ser alterado.' });
    }

    const campos: { chave: string; valor: unknown }[] = [];

    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || !body.nome.trim()) {
        return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
      }
      campos.push({ chave: 'nome', valor: body.nome.trim() });
    }

    if (body.data_nascimento !== undefined) {
      const dataNascimento = body.data_nascimento ? String(body.data_nascimento).trim() : null;
      campos.push({ chave: 'data_nascimento', valor: dataNascimento });
    }

    if (body.telefone !== undefined) {
      const telefone = body.telefone ? String(body.telefone).trim() : null;
      campos.push({ chave: 'telefone', valor: telefone });
    }

    if (body.whatsapp_push !== undefined) {
      campos.push({ chave: 'whatsapp_push', valor: Boolean(body.whatsapp_push) });
    }

    if (body.email !== undefined) {
      const email = body.email ? String(body.email).trim().toLowerCase() : null;
      campos.push({ chave: 'email', valor: email });
    }

    if (body.convenio_id !== undefined) {
      const convenioId = body.convenio_id ? String(body.convenio_id).trim() : null;
      campos.push({ chave: 'convenio_id', valor: convenioId });
    }

    if (body.numero_carteirinha !== undefined) {
      const numeroCarteirinha = body.numero_carteirinha ? String(body.numero_carteirinha).trim() : null;
      campos.push({ chave: 'numero_carteirinha', valor: numeroCarteirinha });
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
    }

    campos.push({ chave: 'atualizado_em', valor: new Date().toISOString() });

    const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
    const valores = campos.map((campo) => campo.valor);

    const resultado = await pool.query<Paciente>(
      `UPDATE pacientes
          SET ${setClauses}
        WHERE id = $${campos.length + 1}
      RETURNING id,
                codigo_paciente,
                nome,
                data_nascimento,
                telefone,
                whatsapp_push,
                email,
                convenio_id,
                NULL::TEXT AS convenio_nome,
                numero_carteirinha,
                criado_em`,
      [...valores, id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Paciente nao encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Paciente atualizado com sucesso.',
      paciente: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof Error && error.message.includes('unique constraint')) {
      return res.status(409).json({ erro: 'Codigo de paciente ou email ja cadastrado.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao atualizar paciente.' });
  }
}

export async function deletarPaciente(req: VercelRequest, res: VercelResponse) {
  let id: string;
  try {
    id = extrairIdDaUrl(req);
    const usuarioLogado = autenticarRequisicao(req);
    verificarPermissaoDeletar(usuarioLogado);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const resultado = await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Paciente nao encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Paciente excluido com sucesso.' });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno ao excluir paciente.' });
  }
}
