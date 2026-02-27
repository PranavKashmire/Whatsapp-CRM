const router = require('express').Router();
const db = require('../db');
const { assignCaller } = require('../services/assignment');
const { broadcast } = require('../services/websocket');

// ── GET /api/leads  (with optional filters) ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { state, source, search, limit = 200, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (state) { conditions.push(`l.state LIKE ?`); params.push(state); }
    if (source) { conditions.push(`l.source = ?`); params.push(source); }
    if (search) {
      conditions.push(`(l.name LIKE ? OR l.phone LIKE ? OR l.city LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT l.*, c.name AS caller_name, c.role AS caller_role
       FROM leads l
       LEFT JOIN callers c ON c.id = l.assigned_caller_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as count FROM leads l ${where}`,
      params
    );

    res.json({ leads: rows, total: parseInt(countRows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/leads/stats ──────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [total, active, todayCount, assigned] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM leads'),
      db.query('SELECT COUNT(*) as count FROM callers WHERE active = 1'),
      db.query("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')"),
      db.query('SELECT COUNT(*) as count FROM leads WHERE assigned_caller_id IS NOT NULL'),
    ]);
    res.json({
      total_leads: parseInt(total.rows[0].count),
      active_callers: parseInt(active.rows[0].count),
      leads_today: parseInt(todayCount.rows[0].count),
      assigned_leads: parseInt(assigned.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/leads/manual  (add lead from UI + auto-assign) ──────────────────
router.post('/manual', async (req, res) => {
  try {
    const { name, phone, source, city, state, notes } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    const normalized = phone.replace(/\D/g, '').slice(-10);

    const { rows: dup } = await db.query(
      'SELECT id FROM leads WHERE phone = ?', [normalized]
    );
    if (dup.length) return res.status(409).json({ error: 'Lead already exists' });

    const { caller, reason } = await assignCaller({ state });

    const insertResult = await db.query(
      `INSERT INTO leads (name, phone, timestamp, source, city, state, notes, assigned_caller_id)
       VALUES (?,?,CURRENT_TIMESTAMP,?,?,?,?,?)`,
      [name, normalized, source || 'Manual', city, state, notes || '', caller?.id || null]
    );

    // Fetch the newly inserted lead manually since we can't reliably use RETURNING in the polyfill
    const { rows: insertedRows } = await db.query('SELECT * FROM leads WHERE id = ?', [insertResult.lastID]);
    const leadRow = insertedRows[0];

    await db.query(
      'INSERT INTO assignment_log (lead_id, caller_id, reason) VALUES (?,?,?)',
      [leadRow.id, caller?.id || null, reason]
    );

    broadcast('new_lead', {
      ...leadRow,
      caller_name: caller?.name || null,
      caller_role: caller?.role || null,
      assignment_reason: reason,
    });

    res.json({ lead: leadRow, assigned_to: caller?.name || null, reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
