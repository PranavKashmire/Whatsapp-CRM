import { useState } from 'react'
import { NeoCard, NeoButton, NeoBadge, NeoSelect, NeoInput, tokens } from '../components/neo/NeoDesignSystem.jsx'
import { AddLeadModal } from '../components/AddLeadModal.jsx'
import { api } from '../api/index.js'

const SOURCE_COLORS = {
  'Meta Forms': tokens.colors.cyan,
  'Reels':      tokens.colors.pink,
  'Story':      tokens.colors.yellow,
  'WhatsApp':   tokens.colors.lime,
  'Manual':     tokens.colors.gray,
}

const REASON_LABELS = {
  state_match:     { label: 'State',    color: tokens.colors.cyan },
  global_fallback: { label: 'Global',   color: tokens.colors.yellow },
  all_capped:      { label: 'Capped',   color: tokens.colors.pink },
}

function LeadRow({ lead, expanded, onToggle, index }) {
  const ts = new Date(lead.created_at || lead.timestamp)
  const srcColor = SOURCE_COLORS[lead.source] || tokens.colors.gray

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          background: expanded ? tokens.colors.yellow : index % 2 === 0 ? tokens.colors.white : tokens.colors.offwhite,
          borderBottom: '2px solid #0A0A0A',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#FFFDE0'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = index % 2 === 0 ? tokens.colors.white : tokens.colors.offwhite; }}
      >
        <td style={{ padding: '12px 16px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>{lead.name}</td>
        <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#555' }}>{lead.phone}</td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>{lead.city}</span>
          <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>{lead.state}</span>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <NeoBadge label={lead.source} color={srcColor} />
        </td>
        <td style={{ padding: '12px 16px' }}>
          {lead.caller_name
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "'Syne', sans-serif", color: tokens.colors.black }}>{lead.caller_name}</span>
                {REASON_LABELS[lead.assignment_reason] && (
                  <NeoBadge label={REASON_LABELS[lead.assignment_reason].label} color={REASON_LABELS[lead.assignment_reason].color} />
                )}
              </div>
            : <NeoBadge label="UNASSIGNED" color={tokens.colors.pink} textColor="#fff" />
          }
        </td>
        <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#888' }}>
          {ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          <div>{ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 16 }}>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr style={{ background: tokens.colors.yellow }}>
          <td colSpan={7} style={{ padding: '16px 20px', borderBottom: '2px solid #0A0A0A' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                ['Full Name', lead.name],
                ['Phone', lead.phone],
                ['City', lead.city],
                ['State', lead.state],
                ['Source', lead.source],
                ['Assigned To', lead.caller_name || 'Unassigned'],
                ['Assignment', lead.assignment_reason || '—'],
                ['Notes', lead.notes || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 9, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function LeadsPage({ leads, callers, onLeadAdded, toast }) {
  const [search, setSearch]   = useState('')
  const [fState, setFState]   = useState('')
  const [fSource, setFSource] = useState('')
  const [fCaller, setFCaller] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newIds, setNewIds]   = useState(new Set())

  const markNew = (id) => {
    setNewIds(s => new Set([...s, id]))
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 5000)
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    return (
      (!q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.city?.toLowerCase().includes(q)) &&
      (!fState  || l.state  === fState) &&
      (!fSource || l.source === fSource) &&
      (!fCaller || String(l.assigned_caller_id) === fCaller)
    )
  })

  const states  = [...new Set(leads.map(l => l.state ).filter(Boolean))].sort()
  const sources = [...new Set(leads.map(l => l.source).filter(Boolean))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em' }}>Leads</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
            {filtered.length} of {leads.length} shown
          </p>
        </div>
        <NeoButton onClick={() => setShowAdd(true)} color={tokens.colors.yellow} icon="＋">Add Lead</NeoButton>
      </div>

      {/* Filters */}
      <NeoCard color={tokens.colors.offwhite} hover={false} className="p-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <NeoInput placeholder="Search name, phone, city…" value={search} onChange={e => setSearch(e.target.value)} label="Search" />
          <NeoSelect label="State" value={fState} onChange={e => setFState(e.target.value)}
            options={[{ value: '', label: 'All States' }, ...states.map(s => ({ value: s, label: s }))]} />
          <NeoSelect label="Source" value={fSource} onChange={e => setFSource(e.target.value)}
            options={[{ value: '', label: 'All Sources' }, ...sources.map(s => ({ value: s, label: s }))]} />
          <NeoSelect label="Caller" value={fCaller} onChange={e => setFCaller(e.target.value)}
            options={[{ value: '', label: 'All Callers' }, ...callers.map(c => ({ value: String(c.id), label: c.name }))]} />
        </div>
      </NeoCard>

      {/* Table */}
      <NeoCard hover={false} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: tokens.colors.black }}>
                {['Name', 'Phone', 'Location', 'Source', 'Assigned To', 'Time', ''].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: tokens.colors.yellow,
                    borderBottom: '3px solid #0A0A0A',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", color: '#aaa', fontSize: 13 }}>
                    No leads match your filters
                  </td>
                </tr>
              )}
              {filtered.map((lead, i) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  index={i}
                  expanded={expanded === lead.id}
                  onToggle={() => setExpanded(expanded === lead.id ? null : lead.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </NeoCard>

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onAdded={(lead) => { onLeadAdded(lead); setShowAdd(false); }}
          toast={toast}
        />
      )}
    </div>
  )
}
