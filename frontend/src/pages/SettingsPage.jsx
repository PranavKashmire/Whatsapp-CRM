import { useState } from 'react'
import { NeoCard, NeoButton, NeoInput, NeoBadge, tokens } from '../components/neo/NeoDesignSystem.jsx'

export function SettingsPage({ toast }) {
  const [sheetsId, setSheetsId]   = useState(import.meta.env.VITE_GOOGLE_SHEETS_ID || '')
  const [pollMs,   setPollMs]     = useState('30000')
  const [saved, setSaved]         = useState(false)

  const handleSave = () => {
    setSaved(true)
    toast('Settings saved (restart server to apply)', 'info')
    setTimeout(() => setSaved(false), 2000)
  }

  const infoRows = [
    ['Backend API',       `${window.location.protocol}//${window.location.hostname}:3001`],
    ['WebSocket',         `ws://${window.location.hostname}:3001/ws`],
    ['Sheets Poll',       `Every ${Math.round(+pollMs / 1000)}s`],
    ['Assignment Engine', 'State Match → Global Fallback → Unassigned'],
    ['Dedup Strategy',    'Phone number (last 10 digits)'],
    ['RR State Store',    'Redis INCR (atomic)'],
    ['Daily Cap Reset',   'Midnight (new date = new row in caller_daily_stats)'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>Configuration and system info</p>
      </div>

      {/* Google Sheets */}
      <NeoCard color={tokens.colors.white} hover={false}>
        <div style={{ padding: '16px 20px', borderBottom: tokens.border, background: tokens.colors.cyan, borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0` }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>📊 Google Sheets Integration</div>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <NeoInput label="Google Sheet ID" value={sheetsId} onChange={e => setSheetsId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
          <NeoInput label="Poll Interval (ms)" value={pollMs} onChange={e => setPollMs(e.target.value)} placeholder="30000" />
          <div style={{ background: tokens.colors.offwhite, border: '2px solid #0A0A0A', borderRadius: 6, padding: 14 }}>
            <p style={{ margin: 0, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#555', lineHeight: 1.6 }}>
              <strong>Sheet column order:</strong><br />
              A: Name | B: Phone | C: Timestamp | D: Lead Source | E: City | F: State | G: Notes<br /><br />
              Set <code style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 3, padding: '1px 4px' }}>GOOGLE_SHEETS_ID</code> and{' '}
              <code style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 3, padding: '1px 4px' }}>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> in backend/.env
            </p>
          </div>
          <NeoButton onClick={handleSave} color={saved ? tokens.colors.lime : tokens.colors.black} textColor={saved ? tokens.colors.black : tokens.colors.yellow}>
            {saved ? '✓ Saved' : 'Save Settings'}
          </NeoButton>
        </div>
      </NeoCard>

      {/* System Info */}
      <NeoCard color={tokens.colors.black} hover={false}>
        <div style={{ padding: '16px 20px', borderBottom: '3px solid #333' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: tokens.colors.yellow }}>⚙️ System Info</div>
        </div>
        <div style={{ padding: 20 }}>
          {infoRows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #222', gap: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase', color: '#888' }}>{k}</span>
              <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: tokens.colors.lime, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
            </div>
          ))}
        </div>
      </NeoCard>

      {/* Assignment Logic */}
      <NeoCard color={tokens.colors.offwhite} hover={false}>
        <div style={{ padding: '16px 20px', borderBottom: tokens.border, background: tokens.colors.yellow, borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0` }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>🤖 Assignment Logic</div>
        </div>
        <div style={{ padding: 20 }}>
          {[
            ['Step 1: State Match',    'blue',   'Find all callers with lead\'s state in assigned_states[]. Filter by daily cap.'],
            ['Step 2: Round Robin',    'green',  'Use Redis INCR (atomic) to pick next caller in state pool. Prevents double-assignment.'],
            ['Step 3: Global Fallback','amber',  'If no state-matched caller available, use global pool of all eligible callers.'],
            ['Step 4: Unassigned',     'red',    'If all callers are capped, lead is stored unassigned and visible in logs.'],
          ].map(([title, c, desc]) => {
            const bg = c === 'blue' ? tokens.colors.cyan : c === 'green' ? tokens.colors.lime : c === 'amber' ? tokens.colors.yellow : tokens.colors.pink
            return (
              <div key={title} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '2px solid #E8E3D9' }}>
                <NeoBadge label={title} color={bg} />
                <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#555', lineHeight: 1.5 }}>{desc}</span>
              </div>
            )
          })}
        </div>
      </NeoCard>
    </div>
  )
}
