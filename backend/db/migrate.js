require('dotenv').config();
const db = require('./index');

async function migrate() {
  try {
    await db.query('BEGIN TRANSACTION');

    await db.query(`
      CREATE TABLE IF NOT EXISTS callers (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        name            VARCHAR(100) NOT NULL,
        role            VARCHAR(50) DEFAULT 'Caller',
        languages       TEXT DEFAULT '[]',
        assigned_states TEXT DEFAULT '[]',
        daily_limit     INTEGER DEFAULT 50,
        active          BOOLEAN DEFAULT 1,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        name                VARCHAR(100),
        phone               VARCHAR(20) UNIQUE,
        timestamp           DATETIME,
        source              VARCHAR(50),
        city                VARCHAR(100),
        state               VARCHAR(100),
        notes               TEXT DEFAULT '',
        assigned_caller_id  INTEGER REFERENCES callers(id) ON DELETE SET NULL,
        sheets_row          INTEGER,
        synced_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS caller_daily_stats (
        caller_id   INTEGER REFERENCES callers(id) ON DELETE CASCADE,
        date        DATE NOT NULL DEFAULT CURRENT_DATE,
        leads_count INTEGER DEFAULT 0,
        PRIMARY KEY (caller_id, date)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS assignment_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        caller_id   INTEGER REFERENCES callers(id) ON DELETE SET NULL,
        reason      TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(state);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_caller_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_stats_date ON caller_daily_stats(date);`);

    await db.query('COMMIT');
    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
