const { Pool } = require('pg');
const logger   = require('./logger');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name  VARCHAR(100) DEFAULT '',
      last_name   VARCHAR(100) DEFAULT '',
      role        VARCHAR(20)  DEFAULT 'user'
                  CHECK (role IN ('admin','operator','user')),
      is_active   BOOLEAN DEFAULT true,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  logger.info('Table app_users prête');
}

module.exports = { pool, initDB };
