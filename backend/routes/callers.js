const router = require('express').Router();
const db = require('../db');
const { getDailyCount } = require('../services/assignment');
const { broadcast } = require('../services/websocket');

// ── Helpers
function parseCallerJson(caller) {
  try { caller.languages = JSON.parse(caller.languages || '[]'); } catch (e) { caller.languages = []; }
  try { caller.assigned_states = JSON.parse(caller.assigned_states || '[]'); } catch (e) { caller.assigned_states = []; }
  // Provide the boolean active correctly
  caller.active = !!caller.active;
  return caller;
}

// GET /api/callers
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*,
         COALESCE(s.leads_count, 0) AS leads_today,
         COUNT(l.id) AS total_leads_assigned
       FROM callers c
       LEFT JOIN caller_daily_stats s ON s.caller_id = c.id AND s.date = DATE('now')
       LEFT JOIN leads l ON l.assigned_caller_id = c.id
       GROUP BY c.id, c.name, c.role, c.languages, c.assigned_states, c.daily_limit, c.active, c.created_at, c.updated_at, s.leads_count
       ORDER BY c.id`
    );
    res.json({ callers: rows.map(parseCallerJson) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/callers
router.post('/', async (req, res) => {
  try {
    const { name, role, languages, assigned_states, daily_limit, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const { rows } = await db.query(
      `INSERT INTO callers (name, role, languages, assigned_states, daily_limit, active)
       VALUES (?,?,?,?,?,?) RETURNING *`,
      [name, role || 'Caller', JSON.stringify(languages || []), JSON.stringify(assigned_states || []), daily_limit || 50, active !== false ? 1 : 0]
    );

    const caller = parseCallerJson(rows[0]);
    broadcast('caller_updated', { action: 'created', caller });
    res.status(201).json({ caller });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/callers/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, languages, assigned_states, daily_limit, active } = req.body;

    const { rows: existingRows } = await db.query('SELECT * FROM callers WHERE id = ?', [id]);
    if (!existingRows[0]) return res.status(404).json({ error: 'Caller not found' });
    const existing = existingRows[0];

    // In SQLite, coalesce won't work well if we don't pass original values
    const newName = name !== undefined ? name : existing.name;
    const newRole = role !== undefined ? role : existing.role;
    const newLanguages = languages !== undefined ? JSON.stringify(languages) : existing.languages;
    const newAssignedStates = assigned_states !== undefined ? JSON.stringify(assigned_states) : existing.assigned_states;
    const newDailyLimit = daily_limit !== undefined ? daily_limit : existing.daily_limit;
    const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

    const { rows } = await db.query(
      `UPDATE callers SET
         name            = ?,
         role            = ?,
         languages       = ?,
         assigned_states = ?,
         daily_limit     = ?,
         active          = ?,
         updated_at      = CURRENT_TIMESTAMP
       WHERE id=? RETURNING *`,
      [newName, newRole, newLanguages, newAssignedStates, newDailyLimit, newActive, id]
    );

    const caller = parseCallerJson(rows[0]);
    broadcast('caller_updated', { action: 'updated', caller });
    res.json({ caller });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/callers/:id  (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE callers SET active=0 WHERE id=?', [req.params.id]);
    broadcast('caller_updated', { action: 'deactivated', callerId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/callers/:id/leads
router.get('/:id/leads', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM leads WHERE assigned_caller_id=? ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ leads: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
