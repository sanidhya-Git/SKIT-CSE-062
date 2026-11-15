#!/usr/bin/env node
/**
 * OneOps AI — database migration runner
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host:5432/oneops node database/migrate.js
 *
 * Reads all files in database/migrations/ in numeric order and applies
 * any that have not yet been recorded in the migrations tracking table.
 */

'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/** Ensure the migrations tracking table exists. */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

/** Return the set of migration filenames already applied. */
async function getAppliedMigrations(client) {
  const result = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY id'
  );
  return new Set(result.rows.map((r) => r.filename));
}

/** Read migration files in numeric order. */
function getMigrationFiles() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)?.[1] ?? '0', 10);
      const numB = parseInt(b.match(/^(\d+)/)?.[1] ?? '0', 10);
      return numA - numB;
    });
  return files;
}

/** Apply a single migration file inside a transaction. */
async function applyMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`  Applying ${filename} …`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`  ✓ ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${filename} failed: ${err.message}`);
  }
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database.');

    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const files = getMigrationFiles();
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    for (const file of pending) {
      await applyMigration(client, file);
    }

    console.log(`\nAll migrations applied successfully.`);
  } catch (err) {
    console.error(`\nMigration runner error: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
