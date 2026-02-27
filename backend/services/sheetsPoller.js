/**
 * Google Sheets Poller — Pure Node.js, no n8n/Zapier
 *
 * Uses googleapis SDK to poll the sheet every POLL_INTERVAL_MS.
 * On each poll it compares against what's already in the DB (by phone),
 * inserts any new rows, runs the assignment engine, and broadcasts via WS.
 */
const { google } = require('googleapis');
const db = require('../db');
const { assignCaller } = require('./assignment');
const { broadcast } = require('./websocket');

// ─── Auth ────────────────────────────────────────────────────────────────────
function buildAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

// ─── Fetch all rows from the sheet ──────────────────────────────────────────
async function fetchAllRows() {
  const auth = buildAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Sheet1!A2:G',   // A=Name B=Phone C=Timestamp D=Source E=City F=State G=Notes
  });

  const rows = response.data.values || [];
  return rows
    .map((row, i) => ({
      name: (row[0] || '').trim(),
      phone: normalizePhone(row[1] || ''),
      timestamp: parseTimestamp(row[2]),
      source: (row[3] || 'Unknown').trim(),
      city: (row[4] || '').trim(),
      state: (row[5] || '').trim(),
      notes: (row[6] || '').trim(),
      sheets_row: i + 2,
    }))
    .filter(r => r.phone); // skip rows with no phone
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizePhone(raw) {
  return String(raw).replace(/\D/g, '').slice(-10);
}

function parseTimestamp(raw) {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ─── Process a single new row ────────────────────────────────────────────────
async function processRow(row) {
  // 1. Dedup check
  const { rows: existing } = await db.query(
    'SELECT id FROM leads WHERE phone = ?',
    [row.phone]
  );
  if (existing.length > 0) return null; // already synced

  // 2. Assign caller
  const { caller, reason } = await assignCaller({ state: row.state });

  // 3. Insert lead
  const { rows: inserted } = await db.query(
    `INSERT INTO leads
       (name, phone, timestamp, source, city, state, notes, assigned_caller_id, sheets_row)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT (phone) DO NOTHING
     RETURNING *`,
    [row.name, row.phone, row.timestamp, row.source, row.city,
    row.state, row.notes, caller?.id || null, row.sheets_row]
  );

  if (!inserted[0]) return null; // lost a race condition, skip

  // 4. Audit log
  await db.query(
    'INSERT INTO assignment_log (lead_id, caller_id, reason) VALUES (?,?,?)',
    [inserted[0].id, caller?.id || null, reason]
  );

  // 5. Real-time broadcast to all browser tabs
  broadcast('new_lead', {
    ...inserted[0],
    caller_name: caller?.name || null,
    caller_role: caller?.role || null,
    assignment_reason: reason,
  });

  console.log(
    `[Sheets] ✅ New lead: "${row.name}" (${row.state || 'no state'})` +
    ` → ${caller?.name || 'UNASSIGNED'} [${reason}]`
  );

  return inserted[0];
}

// ─── One full poll cycle ──────────────────────────────────────────────────────
async function runPollCycle() {
  try {
    const rows = await fetchAllRows();
    let newCount = 0;
    for (const row of rows) {
      const result = await processRow(row);
      if (result) newCount++;
    }
    if (newCount > 0) {
      console.log(`[Sheets] Poll complete — ${newCount} new lead(s) synced`);
    }
    return newCount;
  } catch (err) {
    // Don't crash the server on transient Google API errors
    console.error('[Sheets] Poll error:', err.message);
    return 0;
  }
}

// ─── Start polling loop ───────────────────────────────────────────────────────
function startPolling(intervalMs = 30_000) {
  if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.warn('[Sheets] ⚠️  GOOGLE_SHEETS_ID or GOOGLE_SERVICE_ACCOUNT_EMAIL not set — polling disabled');
    return null;
  }

  console.log(`[Sheets] 🔄 Starting poll every ${intervalMs / 1000}s`);

  // Run immediately on startup, then on interval
  runPollCycle();
  const timer = setInterval(runPollCycle, intervalMs);
  return timer;
}

// ─── Manual trigger (called by POST /api/sync) ────────────────────────────────
async function manualSync() {
  return runPollCycle();
}

module.exports = { startPolling, manualSync, fetchAllRows };
