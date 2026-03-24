import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

function parseArgs(argv) {
  const args = {
    envFile: '',
    email: '',
    password: '',
    name: '',
    role: '',
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
      continue;
    }

    if (token === '--email' && argv[i + 1]) {
      args.email = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--password' && argv[i + 1]) {
      args.password = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--name' && argv[i + 1]) {
      args.name = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--role' && argv[i + 1]) {
      args.role = argv[i + 1];
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
  console.log('  node ../database/scripts/db-upsert-base-user.mjs --env ../.env.development --email admin@dominio.com --password SenhaForte');
  console.log('');
  console.log('Parametros opcionais:');
  console.log('  --name <nome>      (padrao: BASE_USER_NAME ou Administrador)');
  console.log('  --role <tipo>      (padrao: BASE_USER_ROLE ou admin)');
  console.log('');
  console.log('Tambem aceita variaveis de ambiente:');
  console.log('  BASE_USER_EMAIL, BASE_USER_PASSWORD, BASE_USER_NAME, BASE_USER_ROLE');
}

async function run() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    return;
  }

  loadEnvFile(args.envFile);

  const databaseUrl = process.env.DATABASE_URL;
  const email = args.email || process.env.BASE_USER_EMAIL || '';
  const password = args.password || process.env.BASE_USER_PASSWORD || '';
  const name = args.name || process.env.BASE_USER_NAME || 'Administrador';
  const role = (args.role || process.env.BASE_USER_ROLE || 'admin').toLowerCase();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao definido.');
  }

  if (!email) {
    throw new Error('Email do usuario base nao definido. Use --email ou BASE_USER_EMAIL.');
  }

  if (!password) {
    throw new Error('Senha do usuario base nao definida. Use --password ou BASE_USER_PASSWORD.');
  }

  if (role !== 'admin' && role !== 'dentista' && role !== 'recepcionista') {
    throw new Error('Role invalida. Use admin ou dentista ou recepcionista.');
  }

  const sql = neon(databaseUrl);

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, ativo)
    VALUES (${name}, ${email}, crypt(${password}, gen_salt('bf', 12)), ${role}, TRUE)
    ON CONFLICT (email)
    DO UPDATE SET
      nome = EXCLUDED.nome,
      senha_hash = EXCLUDED.senha_hash,
      tipo_usuario = EXCLUDED.tipo_usuario,
      ativo = EXCLUDED.ativo,
      atualizado_em = NOW()
  `;

  console.log(`Usuario base aplicado com sucesso para: ${email}`);
}

run().catch((error) => {
  console.error('Falha ao criar/atualizar usuario base.');
  console.error(error);
  process.exit(1);
});
