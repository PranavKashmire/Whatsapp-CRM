/**
 * POST /api/sync
 * Manually trigger a Google Sheets poll cycle.
 * Useful for testing without waiting for the interval.
 */
const router = require('express').Router();
const { manualSync } = require('../services/sheetsPoller');

router.post('/', async (_req, res) => {
  try {
    const newLeads = await manualSync();
    res.json({ success: true, new_leads: newLeads });
  } catch (err) {
    console.error('[sync route]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
