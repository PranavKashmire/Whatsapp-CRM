import { useState, useEffect } from 'react'
import { NeoCard, NeoButton, NeoBadge, NeoSkeleton, tokens } from '../components/neo/NeoDesignSystem.jsx'
import { api } from '../api/index.js'

function StatCard({ label, value, color, icon, sub, loading }) {
  return (
    <NeoCard color={color} className="p-5" accent={tokens.colors.black}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.colors.black, opacity: 0.7, marginBottom: 6 }}>
            {label}
          </div>
          {loading
            ? <NeoSkeleton width={80} height={40} />
            : <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Syne', sans-serif", lineHeight: 1, color: tokens.colors.black }}>{value ?? '—'}</div>
          }
          {sub && <div style={{ fontSize: 11, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", color: tokens.colors.black, opacity: 0.6 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 32 }}>{icon}</span>
      </div>
    </NeoCard>
  )
}

function ActivityFeed({ leads }) {
  const recent = [...leads].slice(0, 8)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {recent.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#999', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          No recent activity. Sync a lead to begin.
        </div>
      )}
      {recent.map((lead, i) => {
        const ts = new Date(lead.created_at || lead.timestamp)
        return (
          <div key={lead.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < recent.length - 1 ? '2px solid #E8E3D9' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
          }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: tokens.colors.cyan,
              border: '2px solid #0A0A0A',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, fontFamily: "'Syne', sans-serif",
              color: tokens.colors.black,
            }}>
              {(lead.name || '?')[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif", truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {lead.name}
              </div>
              <div style={{ fontSize: 11, color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>
                {lead.state} · {lead.source}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {lead.caller_name
                ? <NeoBadge label={lead.caller_name.split(' ')[0]} color={tokens.colors.lime} />
                : <NeoBadge label="UNASSIGNED" color={tokens.colors.pink} textColor="#fff" />
              }
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>
                {ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CallerWorkload({ callers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {callers.map((c, i) => {
        const pct = Math.min(((c.leads_today || 0) / c.daily_limit) * 100, 100)
        const isCapped = pct >= 100
        const color = pct >= 100 ? tokens.colors.pink : pct >= 80 ? tokens.colors.orange : tokens.colors.lime
        return (
          <div key={c.id} style={{
            padding: '14px 16px',
            borderBottom: i < callers.length - 1 ? '2px solid #E8E3D9' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif" }}>{c.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isCapped && <NeoBadge label="CAPPED" color={tokens.colors.pink} textColor="#fff" />}
                <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                  {c.leads_today || 0}/{c.daily_limit}
                </span>
              </div>
            </div>
            <div style={{ height: 10, background: '#E8E3D9', border: '2px solid #0A0A0A', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )
      })}
      {callers.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#999', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          No callers added yet
        </div>
      )}
    </div>
  )
}

export function DashboardPage({ leads, callers, stats, loading, onSync, syncing }) {
  const statCards = [
    { label: 'Total Leads',     value: stats.total_leads,    color: tokens.colors.yellow, icon: '📥', sub: 'from Google Sheets' },
    { label: "Today's Leads",   value: stats.leads_today,    color: tokens.colors.cyan,   icon: '⚡', sub: 'synced today' },
    { label: 'Assigned',        value: stats.assigned_leads, color: tokens.colors.lime,   icon: '✓',  sub: 'auto-assigned' },
    { label: 'Active Callers',  value: stats.active_callers, color: tokens.colors.pink,   icon: '👤', sub: `${callers.filter(c=>(c.leads_today||0)>=c.daily_limit).length} capped`, textColor: '#fff' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, color: tokens.colors.black, letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <NeoButton onClick={onSync} disabled={syncing} color={tokens.colors.black} textColor={tokens.colors.yellow} icon="🔄">
          {syncing ? 'Syncing…' : 'Sync Sheets'}
        </NeoButton>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* Main 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* Activity Feed */}
        <NeoCard color={tokens.colors.white} hover={false}>
          <div style={{
            padding: '16px 20px', borderBottom: tokens.border,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: tokens.colors.offwhite,
            borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0`,
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>
              Recent Leads
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#777' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tokens.colors.lime, display: 'inline-block', animation: 'neoPulse 2s infinite' }} />
              LIVE
            </div>
          </div>
          {loading
            ? <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3,4].map(i => <NeoSkeleton key={i} height={48} />)}
              </div>
            : <ActivityFeed leads={leads} />
          }
        </NeoCard>

        {/* Caller Workload */}
        <NeoCard color={tokens.colors.white} hover={false}>
          <div style={{
            padding: '16px 20px', borderBottom: tokens.border,
            background: tokens.colors.black,
            borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0`,
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: tokens.colors.yellow }}>
              Caller Workload
            </div>
          </div>
          {loading
            ? <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <NeoSkeleton key={i} height={56} />)}
              </div>
            : <CallerWorkload callers={callers} />
          }
        </NeoCard>
      </div>
    </div>
  )
}
