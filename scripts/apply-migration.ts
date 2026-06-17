import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Client } from 'pg';

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME ?? 'postgres';
const port = Number(process.env.DB_PORT ?? '5432');
const file = process.env.MIGRATION_FILE;

if (!host || !user || !password || !file) {
  console.error('Missing DB_HOST, DB_USER, DB_PASSWORD or MIGRATION_FILE');
  process.exit(1);
}

const sql = readFileSync(resolve(file), 'utf-8');

async function run() {
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Migration applied successfully');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
