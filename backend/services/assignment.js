/**
 * Smart Lead Assignment Engine — Pure Node.js
 *
 * Priority:
 *   1. State-matched callers, round-robin among eligible (under daily cap)
 *   2. Global round-robin across all eligible callers as fallback
 *   3. Returns { caller: null, reason: 'all_capped' } if everyone is full
 *
 * Redis-free memory safety:
 *   Round-robin pointers are stored in memory maps locally.
 *   Daily counts are cached locally via Map.
 */
const db = require('../db');

const today = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// In-memory KV stores
const cache = new Map();
const rrCounters = new Map();

// ─── Daily cap helpers ────────────────────────────────────────────────────────

async function getDailyCount(callerId) {
  const key = `cap:${callerId}:${today()}`;

  if (cache.has(key)) return cache.get(key);

  // Cache miss — read from DB
  const { rows } = await db.query(
    `SELECT leads_count FROM caller_daily_stats
     WHERE caller_id = ? AND date = DATE('now')`,
    [callerId]
  );
  const count = rows[0]?.leads_count || 0;

  // Cache it
  cache.set(key, count);

  return count;
}

async function incrementDailyCount(callerId) {
  const key = `cap:${callerId}:${today()}`;

  const currentCount = (cache.get(key) || 0) + 1;
  cache.set(key, currentCount);

  // Upsert pattern for sqlite
  const { rows } = await db.query(
    `SELECT 1 FROM caller_daily_stats WHERE caller_id = ? AND date = DATE('now')`,
    [callerId]
  );

  if (rows.length > 0) {
    await db.query(
      `UPDATE caller_daily_stats SET leads_count = leads_count + 1 WHERE caller_id = ? AND date = DATE('now')`,
      [callerId]
    );
  } else {
    await db.query(
      `INSERT INTO caller_daily_stats (caller_id, date, leads_count) VALUES (?, DATE('now'), 1)`,
      [callerId]
    );
  }
}

// ─── Round-robin counter (atomic via Redis INCR -> in-memory Map) ──────────────────────────────

async function nextRRIndex(poolKey, poolSize) {
  const current = (rrCounters.get(poolKey) || 0) + 1;
  rrCounters.set(poolKey, current);
  return (current - 1) % poolSize;
}

// ─── Main assignment function ─────────────────────────────────────────────────

async function assignCaller(lead) {
  // Load all active callers
  const { rows: callers } = await db.query(
    `SELECT id, name, role, daily_limit, assigned_states, languages
     FROM callers
     WHERE active = 1
     ORDER BY id`
  );
  if (!callers.length) return { caller: null, reason: 'no_callers' };

  // Parse JSON states and build eligible list
  const eligible = [];
  for (const c of callers) {
    // Parse assigned_states from JSON string (SQLite)
    let statesArr = [];
    try {
      statesArr = JSON.parse(c.assigned_states || '[]');
    } catch (e) { }
    c.assigned_states = statesArr;

    const count = await getDailyCount(c.id);
    if (count < c.daily_limit) eligible.push({ ...c, todayCount: count });
  }
  if (!eligible.length) return { caller: null, reason: 'all_capped' };

  // ── Step 1: State-based candidates ─────────────────────────────────────────
  const leadState = (lead.state || '').toLowerCase().trim();
  const statePool = leadState
    ? eligible.filter(c =>
      (c.assigned_states || []).some(s => s.toLowerCase().trim() === leadState)
    )
    : [];

  if (statePool.length > 0) {
    const idx = await nextRRIndex(`state:${lead.state}`, statePool.length);
    const chosen = statePool[idx];
    await incrementDailyCount(chosen.id);
    return { caller: chosen, reason: 'state_match' };
  }

  // ── Step 2: Global fallback ─────────────────────────────────────────────────
  const idx = await nextRRIndex('global', eligible.length);
  const chosen = eligible[idx];
  await incrementDailyCount(chosen.id);
  return { caller: chosen, reason: 'global_fallback' };
}

module.exports = { assignCaller, getDailyCount };
