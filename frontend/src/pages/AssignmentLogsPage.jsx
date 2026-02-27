import { useState, useEffect } from 'react'
import { NeoCard, NeoBadge, NeoButton, tokens } from '../components/neo/NeoDesignSystem.jsx'

const REASON_META = {
  state_match:     { label: 'State Match',     color: tokens.colors.cyan,   icon: '📍' },
  global_fallback: { label: 'Global Fallback', color: tokens.colors.yellow, icon: '🌐' },
  all_capped:      { label: 'All Capped',      color: tokens.colors.pink,   icon: '🚫' },
  no_callers:      { label: 'No Callers',      color: tokens.colors.pink,   icon: '❌' },
}

export function AssignmentLogsPage({ leads, callers }) {
  const [liveLog, setLiveLog] = useState([])
  const [rrPointer, setRrPointer] = useState(0)

  // Build assignment log from leads data
  const logs = leads
    .filter(l => l.assigned_caller_id)
    .map(l => ({
      id:        l.id,
      leadName:  l.name,
      phone:     l.phone,
      state:     l.state,
      caller:    l.caller_name,
      reason:    l.assignment_reason || 'state_match',
      timestamp: l.created_at || l.timestamp,
    }))
    .slice(0, 50)

  const reasonSummary = logs.reduce((acc, l) => {
    acc[l.reason] = (acc[l.reason] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em' }}>Assignment Logs</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
          Every lead assignment is audited here
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {Object.entries(REASON_META).map(([key, meta]) => (
          <NeoCard key={key} color={meta.color} className="p-4">
            <div style={{ fontSize: 24, marginBottom: 4 }}>{meta.icon}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28 }}>
              {reasonSummary[key] || 0}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
              {meta.label}
            </div>
          </NeoCard>
        ))}

        {/* Round-robin visual */}
        <NeoCard color={tokens.colors.black} className="p-4">
          <div style={{ fontSize: 24, marginBottom: 4 }}>🔄</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, color: tokens.colors.yellow }}>
            RR
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.colors.lime }}>
            Round Robin
          </div>
        </NeoCard>
      </div>

      {/* RR Visualizer */}
      <NeoCard color={tokens.colors.offwhite} hover={false}>
        <div style={{ padding: '16px 20px', borderBottom: tokens.border, background: tokens.colors.black, borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0` }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: tokens.colors.yellow }}>
            Round-Robin Visualizer
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#666' }}>
            The pointer moves atomically in Redis after each assignment. State-matched callers get their own sub-pool.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {callers.filter(c => c.active).map((c, i) => {
              const isCapped = (c.leads_today || 0) >= c.daily_limit
              return (
                <div key={c.id} style={{
                  padding: '10px 16px',
                  background: isCapped ? '#E8E3D9' : tokens.colors.lime,
                  border: '3px solid #0A0A0A',
                  borderRadius: tokens.radius.sm,
                  boxShadow: isCapped ? 'none' : tokens.shadow.sm,
                  fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 12,
                  opacity: isCapped ? 0.4 : 1,
                  textDecoration: isCapped ? 'line-through' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                  <span>{c.name.split(' ')[0]}</span>
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{c.leads_today || 0}/{c.daily_limit}</span>
                  {isCapped && <NeoBadge label="CAP" color={tokens.colors.pink} textColor="#fff" />}
                </div>
              )
            })}
            {callers.filter(c => c.active).length === 0 && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#999' }}>No active callers</span>
            )}
          </div>
        </div>
      </NeoCard>

      {/* Log Table */}
      <NeoCard hover={false} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: tokens.border, background: tokens.colors.offwhite, borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0` }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>Assignment History</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: tokens.colors.black }}>
                {['Lead', 'Phone', 'State', 'Assigned To', 'Reason', 'Time'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: tokens.colors.yellow,
                    borderBottom: '3px solid #0A0A0A', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", color: '#aaa', fontSize: 12 }}>
                    No assignments yet
                  </td>
                </tr>
              )}
              {logs.map((log, i) => {
                const meta = REASON_META[log.reason] || REASON_META.state_match
                const ts   = new Date(log.timestamp)
                return (
                  <tr key={log.id} style={{ borderBottom: '2px solid #E8E3D9', background: i % 2 === 0 ? '#fff' : tokens.colors.offwhite }}>
                    <td style={{ padding: '10px 16px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>{log.leadName}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#666' }}>{log.phone}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: "'Syne', sans-serif" }}>{log.state || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "'Syne', sans-serif" }}>{log.caller || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <NeoBadge label={meta.label} color={meta.color} />
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#888' }}>
                      {ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      <div style={{ fontSize: 10 }}>{ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  )
}
