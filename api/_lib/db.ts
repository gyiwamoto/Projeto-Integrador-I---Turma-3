import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL nao definida no ambiente.');
}

const sql = neon(databaseUrl);

export default sql;
