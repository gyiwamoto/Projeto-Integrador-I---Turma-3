import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {
    envFile: '',
  };

  for (let i = 2; i < argv.length; i += 1) {
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

function listMigrationFiles(migrationsDirPath) {
  if (!fs.existsSync(migrationsDirPath)) {
    throw new Error(`Diretorio de migrations nao encontrado: ${migrationsDirPath}`);
  }

  return fs
    .readdirSync(migrationsDirPath)
    .filter((name) => /^\d+_.+\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(client, filename, sql) {
  await client.query('BEGIN');

  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function run() {
  const { envFile } = parseArgs(process.argv);

  loadEnvFile(envFile);

  const databaseUrl = process.env.DATABASE_URL;
  const dbTimeZone = process.env.DB_TIMEZONE || 'America/Sao_Paulo';
  if (!databaseUrl) {
    console.error('DATABASE_URL nao definido. Passe --env ou exporte a variavel no shell.');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const allMigrations = listMigrationFiles(migrationsDir);

  if (allMigrations.length === 0) {
    console.log(`Nenhuma migration encontrada em: ${migrationsDir}`);
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    options: `-c timezone=${dbTimeZone}`,
  });

  try {
    await client.connect();
    await ensureMigrationsTable(client);

    const appliedMigrations = await getAppliedMigrations(client);
    const pendingMigrations = allMigrations.filter((filename) => !appliedMigrations.has(filename));

    if (pendingMigrations.length === 0) {
      console.log('Schema atualizado. Nenhuma migration pendente.');
      return;
    }

    for (const filename of pendingMigrations) {
      const sqlFilePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(sqlFilePath, 'utf8');

      console.log(`Aplicando migration: ${filename}`);
      await applyMigration(client, filename, sql);
    }

    console.log(`Concluido. Migrations aplicadas: ${pendingMigrations.length}`);
  } catch (error) {
    console.error('Falha ao aplicar migrations.');
    console.error(error);

    if (error && typeof error === 'object' && 'code' in error) {
      const pgCode = String(error.code || '');

      if (pgCode === '28P01') {
        console.error('Diagnostico: falha de autenticacao (usuario/senha invalidos).');
        console.error('Verifique o DATABASE_URL no arquivo informado em --env (ex.: ../.env.development).');
        console.error('Se a senha foi alterada no provedor (Neon), atualize a string de conexao.');
      }

      if (pgCode === '3D000') {
        console.error('Diagnostico: banco de dados informado na URL nao existe.');
      }

      if (pgCode === '53300') {
        console.error('Diagnostico: limite de conexoes atingido no servidor PostgreSQL.');
      }
    }

    process.exitCode = 1;
  } finally {
    await client.end();
    process.exit(process.exitCode || 0);
  }
}

run();
