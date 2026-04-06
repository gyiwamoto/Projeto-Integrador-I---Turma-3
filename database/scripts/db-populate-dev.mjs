import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

function parseArgs(argv) {
  const args = {
    envFile: '',
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (token === '--env' && argv[i + 1]) {
      args.envFile = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

function loadEnvFile(envFilePath) {
  if (!envFilePath) {
    return;
  }

  const absolutePath = path.resolve(process.cwd(), envFilePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo .env nao encontrado: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const idx = line.indexOf('=');
    if (idx < 1) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function printUsage() {
  console.log('Uso:');
  console.log('  npm --prefix database run db:populate:dev -- --env .env.development');
  console.log('');
  console.log('Ou diretamente:');
  console.log('  node ./database/scripts/db-populate-dev.mjs --env .env.development');
}

async function upsertUsuario(client, { nome, email, senha, tipoUsuario }) {
  const result = await client.query(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, ativo)
     VALUES ($1, $2, crypt($3, gen_salt('bf', 12)), $4, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET
       nome = EXCLUDED.nome,
       senha_hash = EXCLUDED.senha_hash,
       tipo_usuario = EXCLUDED.tipo_usuario,
       ativo = TRUE,
       atualizado_em = NOW()
     RETURNING id`,
    [nome, email, senha, tipoUsuario],
  );

  return String(result.rows[0].id);
}

async function run() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    return;
  }

  loadEnvFile(args.envFile);

  const databaseUrl = process.env.DATABASE_URL;
  const dbTimeZone = process.env.DB_TIMEZONE || 'America/Sao_Paulo';

  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao definido. Use --env ou exporte no shell.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    options: `-c timezone=${dbTimeZone}`,
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    const usuarioAdminId = await upsertUsuario(client, {
      nome: 'Admin Desenvolvimento',
      email: 'admin.dev@dentista-organizado.local',
      senha: 'Admin@123',
      tipoUsuario: 'admin',
    });

    const usuarioDentistaId = await upsertUsuario(client, {
      nome: 'Dra. Carolina Prado',
      email: 'dentista.dev@dentista-organizado.local',
      senha: 'Dentista@123',
      tipoUsuario: 'dentista',
    });

    const usuarioRecepcaoId = await upsertUsuario(client, {
      nome: 'Recepcao Desenvolvimento',
      email: 'recepcao.dev@dentista-organizado.local',
      senha: 'Recepcao@123',
      tipoUsuario: 'recepcionista',
    });

    const convenioResult = await client.query(
      `INSERT INTO convenios (cnpj, nome, ativo)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (cnpj)
       DO UPDATE SET nome = EXCLUDED.nome, ativo = TRUE, atualizado_em = NOW()
       RETURNING cnpj`,
      ['12345678000195', 'Odonto Plus Desenvolvimento'],
    );
    const convenioCnpj = String(convenioResult.rows[0].cnpj);

    const pacienteResult = await client.query(
      `INSERT INTO pacientes (
        nome,
        data_nascimento,
        telefone,
        whatsapp_push,
        email,
        convenio_cnpj,
        numero_carteirinha
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email)
      DO UPDATE SET
        nome = EXCLUDED.nome,
        data_nascimento = EXCLUDED.data_nascimento,
        telefone = EXCLUDED.telefone,
        whatsapp_push = EXCLUDED.whatsapp_push,
        convenio_cnpj = EXCLUDED.convenio_cnpj,
        numero_carteirinha = EXCLUDED.numero_carteirinha,
        atualizado_em = NOW()
      RETURNING id, codigo_paciente`,
      [
        'Paciente Fluxo Completo',
        '1994-08-19',
        '011 988887777',
        true,
        'paciente.dev@dentista-organizado.local',
        convenioCnpj,
        'ODP-778899',
      ],
    );
    const pacienteId = String(pacienteResult.rows[0].id);

    const tratamentoResult = await client.query(
      `INSERT INTO tratamentos (nome, descricao, valor, ativo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['Restauracao em resina', 'Procedimento restaurador para elemento dental.', 280.0],
    );

    let tratamentoId = '';
    if (tratamentoResult.rowCount && tratamentoResult.rows[0]) {
      tratamentoId = String(tratamentoResult.rows[0].id);
    } else {
      const tratamentoBusca = await client.query(
        `SELECT id
           FROM tratamentos
          WHERE nome = $1
          ORDER BY criado_em ASC
          LIMIT 1`,
        ['Restauracao em resina'],
      );
      tratamentoId = String(tratamentoBusca.rows[0].id);
    }

    const consultaResult = await client.query(
      `SELECT id
         FROM consultas
        WHERE paciente_id = $1
          AND usuario_id = $2
          AND data_consulta::date = CURRENT_DATE
          AND status = 'agendado'
        LIMIT 1`,
      [pacienteId, usuarioDentistaId],
    );

    let consultaId = '';

    if (consultaResult.rowCount && consultaResult.rows[0]) {
      consultaId = String(consultaResult.rows[0].id);
    } else {
      const novaConsulta = await client.query(
        `INSERT INTO consultas (
          paciente_id,
          usuario_id,
          data_consulta,
          status,
          convenio_cnpj,
          numero_carteirinha,
          observacoes
        )
        VALUES (
          $1,
          $2,
          date_trunc('minute', NOW()) + interval '2 hour',
          'agendado',
          $3,
          $4,
          $5
        )
        RETURNING id`,
        [
          pacienteId,
          usuarioDentistaId,
          convenioCnpj,
          'ODP-778899',
          'Consulta de teste para fluxo de atendimento e finalizacao.',
        ],
      );

      consultaId = String(novaConsulta.rows[0].id);
    }

    await client.query(
      `INSERT INTO procedimentos_realizados (
        consulta_id,
        tratamento_id,
        dente,
        face,
        data_procedimento,
        observacoes
      )
      SELECT $1, $2, 16, 'O', CURRENT_DATE, $3
      WHERE NOT EXISTS (
        SELECT 1
          FROM procedimentos_realizados
         WHERE consulta_id = $1
           AND tratamento_id = $2
           AND dente = 16
           AND face = 'O'
           AND data_procedimento = CURRENT_DATE
      )`,
      [
        consultaId,
        tratamentoId,
        'Registro inicial para validacao do odontograma na tela de atendimento.',
      ],
    );

    await client.query(
      `INSERT INTO logs_acessos (
        usuario_id,
        email_informado,
        ip_origem,
        user_agent,
        rota,
        metodo_http,
        status_http,
        sucesso,
        mensagem
      )
      SELECT $1::uuid, $2::varchar, '127.0.0.1'::inet, $3::text, $4::varchar, 'POST', 200, TRUE, $5::text
      WHERE NOT EXISTS (
        SELECT 1
          FROM logs_acessos
         WHERE usuario_id = $1::uuid
           AND rota = $4::varchar
           AND mensagem = $5::text
           AND criado_em::date = CURRENT_DATE
      )`,
      [
        usuarioAdminId,
        'admin.dev@dentista-organizado.local',
        'seed-script/db-populate-dev',
        '/api/auth',
        'Seed develop executado para validar fluxos principais.',
      ],
    );

    await client.query('COMMIT');

    console.log('Seed de develop aplicada com sucesso.');
    console.log('Dados criados/atualizados:');
    console.log(`- usuarios: admin(${usuarioAdminId}), dentista(${usuarioDentistaId}), recepcao(${usuarioRecepcaoId})`);
    console.log(`- convenio: ${convenioCnpj}`);
    console.log(`- paciente: ${pacienteId} (codigo ${pacienteResult.rows[0].codigo_paciente})`);
    console.log(`- tratamento: ${tratamentoId}`);
    console.log(`- consulta agendada de hoje: ${consultaId}`);
    console.log('- procedimento realizado (dente 16, face O)');
    console.log('- log de acesso para auditoria');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Falha ao popular o banco de develop.');
  console.error(error);
  process.exit(1);
});
