import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

function parseArgs(argv) {
  const args = {
    sqlFile: '',
    envFile: '',
  };

  if (argv.length < 3) {
    return args;
  }

  args.sqlFile = argv[2];

  for (let i = 3; i < argv.length; i += 1) {
    const token = argv[i];
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

async function run() {
  const { sqlFile, envFile } = parseArgs(process.argv);

  if (!sqlFile) {
    console.error('Uso: node ../database/scripts/db-run-sql.mjs <arquivo.sql> [--env ../.env.development]');
    process.exit(1);
  }

  loadEnvFile(envFile);

  const databaseUrl = process.env.DATABASE_URL;
  const dbTimeZone = process.env.DB_TIMEZONE || 'America/Sao_Paulo';
  if (!databaseUrl) {
    console.error('DATABASE_URL nao definido. Passe --env ou exporte a variavel no shell.');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), sqlFile);
  if (!fs.existsSync(sqlPath)) {
    console.error(`Arquivo SQL nao encontrado: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    options: `-c timezone=${dbTimeZone}`,
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log(`SQL executado com sucesso: ${sqlPath}`);
  } catch (error) {
    console.error('Falha ao executar SQL.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
