# Bloc Sales CRM

![Application Preview](./preview.webp)

Full-stack Sales CRM with **pure Node.js Google Sheets polling**, smart round-robin lead assignment, and WebSocket real-time updates. No n8n, no Zapier, no Make — everything is code.

---

## How It Works (High Level)

```
Google Sheets
     │
     │  googleapis SDK (Node.js)
     │  polls every 30s
     ▼
Backend (Express)
  ├── sheetsPoller.js   ← fetches new rows, deduplicates by phone
  ├── assignment.js     ← state match → round robin → global fallback
  ├── websocket.js      ← broadcasts new_lead event to all browser tabs
  └── SQLite + In-Memory Maps
     │
     ▼
Frontend (React + Vite)
  ├── Leads table (live-updating)
  ├── Callers management (add/edit/daily cap)
  └── useWebSocket hook (auto-reconnect)
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (Local File) |
| Caching / RR State | In-Memory JavaScript Maps |
| Sheets Integration | `googleapis` npm package (JWT service account) |
| Real-time | WebSocket (`ws` npm package) |

---

## Quick Start

### Prerequisites
- Node.js ≥ 18

### Quick Setup

```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env       # edit with your values
node db/migrate.js         # create tables
node db/seed.js            # load sample callers + leads
npm run dev                # nodemon watches for changes

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

---

## Google Sheets Setup

### 1. Create the Sheet

Column layout (row 1 = headers, row 2+ = data):

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Name | Phone | Timestamp | Lead Source | City | State | Notes |

### 2. Create a Google Cloud Service Account

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Enable **Google Sheets API**
4. Go to **IAM & Admin → Service Accounts → Create**
5. Download the JSON key file
6. Open the JSON — copy `client_email` and `private_key`

### 3. Share the Sheet

Share your Google Sheet with the service account email (view access is enough).

### 4. Configure `.env`

```env
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_EMAIL=crm-sync@my-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
SHEETS_POLL_INTERVAL_MS=30000
```

> The poller starts automatically when the server boots. No webhooks, no external tools.

---

## Database Schema

```sql
-- Who handles leads
CREATE TABLE callers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            VARCHAR(100) NOT NULL,
  role            VARCHAR(50),
  languages       TEXT DEFAULT '[]', -- JSON string
  assigned_states TEXT DEFAULT '[]', -- JSON string
  daily_limit     INTEGER DEFAULT 50,
  active          BOOLEAN DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Incoming leads from Google Sheets
CREATE TABLE leads (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                VARCHAR(100),
  phone               VARCHAR(20) UNIQUE,   -- dedup key, normalized to 10 digits
  timestamp           DATETIME,
  source              VARCHAR(50),           -- 'Meta Forms', 'Reels', etc.
  city                VARCHAR(100),
  state               VARCHAR(100),
  notes               TEXT,
  assigned_caller_id  INTEGER REFERENCES callers(id) ON DELETE SET NULL,
  sheets_row          INTEGER,               -- row number in the Sheet
  synced_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily lead count per caller (used for cap enforcement)
CREATE TABLE caller_daily_stats (
  caller_id   INTEGER REFERENCES callers(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_count INTEGER DEFAULT 0,
  PRIMARY KEY (caller_id, date)
  -- No cron reset needed: each day gets its own row
);

-- Audit trail — every assignment is logged
CREATE TABLE assignment_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  caller_id   INTEGER REFERENCES callers(id) ON DELETE SET NULL,
  reason      TEXT,       -- 'state_match' | 'global_fallback' | 'all_capped'
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### In-Memory Tracking Maps

```
rrCounters.get('global')              → numeric pointer — global round-robin sequence
rrCounters.get('state:{StateName}')   → numeric pointer — per-state round-robin sequence
cache.get('cap:{callerId}:{date}')    → integer — today's lead count, cleared daily
```

---

## Assignment Logic (services/assignment.js)

```
assignCaller(lead):

  1. SELECT all active callers from DB

  2. For each caller:
       count = cache.get("cap:{id}:{today}")
               OR  SELECT leads_count FROM caller_daily_stats WHERE date = today
       if count < daily_limit → add to eligible[]

  3. If no eligible callers → return { caller: null, reason: 'all_capped' }

  4. statePool = eligible.filter(c => c.assigned_states includes lead.state)

     If statePool.length > 0:
       idx = (++rrCounters['state:lead.state']) % statePool.length
       chosen = statePool[idx]
       cache.set(cap:{chosen.id}:{today}, count + 1)
       UPSERT caller_daily_stats +1
       return { caller: chosen, reason: 'state_match' }

  5. Fallback — global pool:
       idx = (++rrCounters['global']) % eligible.length
       chosen = eligible[idx]
       cache.set(cap:{chosen.id}:{today}, count + 1)
       UPSERT caller_daily_stats +1
       return { caller: chosen, reason: 'global_fallback' }
```

**Why Memory Maps?** — Because the database was migrated to SQLite, a simple Node.js memory architecture is safe assuming the application stays deployed to a single node block. Native JavaScript objects remove the need for Docker networks and Redis.

---

## Google Sheets Poller (services/sheetsPoller.js)

This is the heart of the automation — **no external tool needed**. It runs as a continuous background process alongside the API server.

```mermaid
sequenceDiagram
    participant GS as Google Sheets
    participant Poller as sheetsPoller.js
    participant SQLite as Database
    participant Assign as assignment.js
    participant WS as websocket.js
    participant React as Frontend UI

    loop Every 30 Seconds
        Poller->>GS: Fetch Rows (googleapis)
        GS-->>Poller: Return Data Array
        
        loop For Each Row
            Poller->>SQLite: Check for duplicate Phone
            alt Is New Lead
                Poller->>Assign: Run State Match & RR Logic
                Assign-->>Poller: Return Caller & Reason
                Poller->>SQLite: Insert Lead & Assignment Log
                Poller->>WS: Broadcast 'new_lead' event
                WS-->>React: Live UI Update
            else Already Exists
                Poller->>Poller: Skip Row
            end
        end
    end
```

### Automation Code Snippet

```javascript
// Runs on server startup, then every SHEETS_POLL_INTERVAL_MS
async function runPollCycle() {
  const rows = await fetchAllRows();       // googleapis SDK call
  for (const row of rows) {
    // Skip if phone already in DB (dedup)
    const existing = await db.query('SELECT id FROM leads WHERE phone = $1', [row.phone]);
    if (existing.rows.length) continue;

    // Assign caller using the engine
    const { caller, reason } = await assignCaller({ state: row.state });

    // Insert into SQLite DB
    const insertResult = await db.query('INSERT INTO leads ...', [...]);
    const lead = await db.query('SELECT * FROM leads WHERE id = ?', [insertResult.lastID]);

    // Push to all browser tabs via WebSocket
    broadcast('new_lead', { ...lead, caller_name: caller?.name, reason });
  }
}
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/leads` | All leads with caller info. Supports `?search=`, `?state=`, `?source=` |
| GET | `/api/leads/stats` | Dashboard counts |
| POST | `/api/leads/manual` | Add lead from UI, triggers assignment |
| GET | `/api/callers` | All callers with today's counts |
| POST | `/api/callers` | Create caller |
| PATCH | `/api/callers/:id` | Update caller |
| DELETE | `/api/callers/:id` | Deactivate caller (soft delete) |
| POST | `/api/sync` | Manually trigger a Sheets poll cycle |
| GET | `/health` | Health check |

---

## What I Would Improve With More Time

1. **Apps Script webhook** — add `onEdit()` trigger to the Sheet that POSTs to `/api/sync` for sub-second latency (currently polls every 30s)
2. **Lead reassignment** — UI to manually move a lead to a different caller, with audit log entry
3. **Caller absence** — mark a caller as absent for the day without fully deactivating them
4. **Lead queue** — when all callers are capped, queue the lead and auto-assign at midnight reset
5. **WhatsApp message** — send a WhatsApp template message to the lead when assigned (using official API)



## Submission Requirements Checklist

1. Github Repo link - https://github.com/PranavKashmire/Whatsapp-CRM
2. **Screenshot/Explanation of automation workflow**: Rather than a screenshot of a Zapier flowchart, the automation workflow is a programmatic Native Node.js service (`services/sheetsPoller.js`). See the **Google Sheets Poller** section above for the full architectural logic and Mermaid workflow diagram.
3. **Google Sheets link with Test Leads**:(https://docs.google.com/spreadsheets/d/1cjDoKuVqfkrAQNSXEvWdi9jRnr2OatrI_48HlWVnv_c/edit?gid=0#gid=0)
4. **Short video demo of the Web app**:  https://drive.google.com/file/d/1YaZnv-DVdfc3ZLfhWtO27AwMISQ-9HVl/view
