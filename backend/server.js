require('dotenv').config();
const express        = require('express');
const http           = require('http');
const cors           = require('cors');
const { initWebSocket }  = require('./services/websocket');
const { startPolling }   = require('./services/sheetsPoller');

const app    = express();
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/leads',   require('./routes/leads'));
app.use('/api/callers', require('./routes/callers'));
app.use('/api/sync',    require('./routes/sync'));

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n🚀  Bloc CRM API  →  http://localhost:${PORT}`);

  // WebSocket for real-time UI updates
  initWebSocket(server);
  console.log(`📡  WebSocket      →  ws://localhost:${PORT}/ws`);

  // Google Sheets polling (pure Node.js — no n8n/Zapier)
  const POLL_MS = parseInt(process.env.SHEETS_POLL_INTERVAL_MS || '30000', 10);
  startPolling(POLL_MS);
});

module.exports = { app, server };
