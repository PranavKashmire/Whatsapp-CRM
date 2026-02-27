const WebSocket = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WS client connected. Total:', wss.clients.size);
    ws.send(JSON.stringify({ type: 'connected', message: 'Bloc CRM real-time feed active' }));

    ws.on('close', () => console.log('WS client disconnected. Total:', wss.clients.size));
    ws.on('error', (err) => console.error('WS error:', err));
  });

  return wss;
}

/**
 * Broadcast an event to all connected clients
 */
function broadcast(type, payload) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log(`📡 Broadcast [${type}] to ${wss.clients.size} clients`);
}

module.exports = { initWebSocket, broadcast };
