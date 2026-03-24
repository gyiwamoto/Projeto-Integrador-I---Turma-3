import { Pool } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
const dbTimeZone = process.env.DB_TIMEZONE || 'America/Sao_Paulo';

if (!databaseUrl) {
  throw new Error('DATABASE_URL nao definida no ambiente.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  options: `-c timezone=${dbTimeZone}`,
});

export default pool;
