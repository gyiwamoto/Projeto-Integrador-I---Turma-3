import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

function parseArgs(argv) {
  const args = { envFile: '' };
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
  const absolutePath = path.resolve(process.cwd(), envFilePath);
  const content = fs.readFileSync(absolutePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const idx = line.indexOf('=');
    if (idx < 1) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function run() {
  const { envFile } = parseArgs(process.argv);
  if (!envFile) {
    throw new Error('Use --env <arquivo.env>');
  }

  loadEnvFile(envFile);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const result = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('tratamentos', 'consultas', 'procedimentos_realizados')
    ORDER BY table_name, ordinal_position
  `);

  console.table(result.rows);
  await client.end();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
