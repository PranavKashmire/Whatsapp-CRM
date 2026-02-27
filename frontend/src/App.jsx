import { useState, useEffect, useCallback, useRef } from 'react'
import { NeoSidebar } from './components/neo/NeoSidebar.jsx'
import { NeoToast, NeoButton, tokens } from './components/neo/NeoDesignSystem.jsx'
import { DashboardPage }    from './pages/DashboardPage.jsx'
import { LeadsPage }        from './pages/LeadsPage.jsx'
import { CallersPage }      from './pages/CallersPage.jsx'
import { AssignmentLogsPage } from './pages/AssignmentLogsPage.jsx'
import { SettingsPage }     from './pages/SettingsPage.jsx'
import { AddLeadModal }     from './components/AddLeadModal.jsx'
import { api }              from './api/index.js'
import { useWebSocket }     from './hooks/useWebSocket.js'

// ─── Global CSS animations ────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Syne:wght@600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #F5F0E8; }

  @keyframes neoSlideIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes neoShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px); }
  }
  @keyframes neoPulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.5; transform: scale(1.3); }
  }
  @keyframes neoSkeleton {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes neoNewRow {
    0%   { background: #B8FF57; }
    100% { background: transparent; }
  }
  @keyframes neoSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #E8E3D9; }
  ::-webkit-scrollbar-thumb { background: #0A0A0A; border-radius: 3px; }

  input[type=range] {
    -webkit-appearance: none; height: 6px;
    background: #E8E3D9; border: 2px solid #0A0A0A; border-radius: 3px;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
    background: #0A0A0A; cursor: pointer; border: 3px solid #FFE135;
  }
`

export default function App() {
  const [page,    setPage]    = useState('dashboard')
  const [sidebar, setSidebar] = useState(false) // collapsed
  const [leads,   setLeads]   = useState([])
  const [callers, setCallers] = useState([])
  const [stats,   setStats]   = useState({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toasts,  setToasts]  = useState([])
  const [wsStatus,setWsStatus]= useState('connecting')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [search,  setSearch]  = useState('')
  const [newLeadFlash, setNewLeadFlash] = useState(null)

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  // WebSocket
  const handleWsMsg = useCallback((msg) => {
    if (msg.type === 'connected') { setWsStatus('live'); return }
    if (msg.type === 'new_lead') {
      const lead = msg.payload
      setLeads(ls => [lead, ...ls])
      setStats(s => ({ ...s, total_leads: (s.total_leads || 0) + 1, leads_today: (s.leads_today || 0) + 1, assigned_leads: lead.caller_name ? (s.assigned_leads || 0) + 1 : s.assigned_leads }))
      setNewLeadFlash(lead.id)
      setTimeout(() => setNewLeadFlash(null), 4000)
      addToast(`⚡ New lead: ${lead.name} → ${lead.caller_name || 'Unassigned'}`)
      loadCallers()
    }
    if (msg.type === 'caller_updated') loadCallers()
  }, [addToast])

  useWebSocket(handleWsMsg)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsData, callersData, statsData] = await Promise.all([
        api.getLeads({ limit: 200 }),
        api.getCallers(),
        api.getStats(),
      ])
      setLeads(leadsData.leads || [])
      setCallers(callersData.callers || [])
      setStats(statsData)
    } catch(e) {
      addToast('Failed to load data: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCallers = useCallback(async () => {
    try {
      const data = await api.getCallers()
      setCallers(data.callers || [])
    } catch {}
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const data = await api.triggerSync()
      addToast(`Sync complete: ${data.new_leads} new lead(s)`)
      if (data.new_leads > 0) loadAll()
    } catch(e) {
      addToast('Sync failed: ' + e.message, 'error')
    } finally { setSyncing(false) }
  }

  const handleLeadAdded = (lead) => {
    setLeads(ls => [lead, ...ls])
    setStats(s => ({ ...s, total_leads: (s.total_leads || 0) + 1, leads_today: (s.leads_today || 0) + 1 }))
    addToast(`Lead added & assigned!`)
    loadCallers()
  }

  const pages = {
    dashboard:   <DashboardPage leads={leads} callers={callers} stats={stats} loading={loading} onSync={handleSync} syncing={syncing} />,
    leads:       <LeadsPage leads={leads} callers={callers} onLeadAdded={handleLeadAdded} toast={addToast} />,
    callers:     <CallersPage callers={callers} setCallers={setCallers} leads={leads} toast={addToast} />,
    assignments: <AssignmentLogsPage leads={leads} callers={callers} />,
    settings:    <SettingsPage toast={addToast} />,
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F0E8' }}>
        {/* Sidebar */}
        <NeoSidebar
          active={page}
          onNav={setPage}
          collapsed={sidebar}
          onToggle={() => setSidebar(s => !s)}
          liveStatus={wsStatus}
        />

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Top bar */}
          <header style={{
            height: 60,
            background: tokens.colors.white,
            borderBottom: '3px solid #0A0A0A',
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 16,
            position: 'sticky', top: 0, zIndex: 100,
            boxShadow: '0 3px 0px #0A0A0A',
          }}>
            {/* Page title */}
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em', flex: 1 }}>
              {page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}
            </div>

            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: tokens.colors.offwhite,
              border: '2px solid #0A0A0A',
              borderRadius: 6, padding: '6px 14px',
              flex: '0 1 300px',
              boxShadow: '2px 2px 0 #0A0A0A',
            }}>
              <span style={{ fontSize: 14, opacity: 0.5 }}>🔍</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); if (e.target.value) setPage('leads') }}
                placeholder="Search leads…"
                style={{
                  border: 'none', background: 'none', outline: 'none',
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, flex: 1,
                  color: tokens.colors.black,
                }}
              />
              {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900, opacity: 0.5 }}>×</button>}
            </div>

            {/* WS status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: wsStatus === 'live' ? '#22c55e' : '#aaa', fontWeight: 700 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: wsStatus === 'live' ? tokens.colors.lime : '#aaa', display: 'inline-block', animation: wsStatus === 'live' ? 'neoPulse 2s infinite' : 'none' }} />
              {wsStatus === 'live' ? 'LIVE' : 'OFFLINE'}
            </div>

            {/* Sync button */}
            <NeoButton onClick={handleSync} disabled={syncing} size="sm" color={tokens.colors.black} textColor={tokens.colors.yellow}>
              {syncing
                ? <span style={{ display: 'inline-block', animation: 'neoSpin 1s linear infinite' }}>↻</span>
                : '🔄'}
              {syncing ? 'Syncing' : 'Sync'}
            </NeoButton>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, padding: 28, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* New lead flash banner */}
            {newLeadFlash && (
              <div style={{
                marginBottom: 16, padding: '12px 20px',
                background: tokens.colors.lime,
                border: tokens.border, borderRadius: tokens.radius.md,
                boxShadow: tokens.shadow.sm,
                display: 'flex', alignItems: 'center', gap: 12,
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13,
                animation: 'neoSlideIn 0.25s ease',
              }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                New lead just arrived and was auto-assigned!
                <NeoButton size="sm" onClick={() => setPage('leads')} color={tokens.colors.black} textColor={tokens.colors.yellow}>
                  View →
                </NeoButton>
              </div>
            )}

            {pages[page] || pages.dashboard}
          </main>
        </div>
      </div>

      {/* Floating Quick Add */}
      <button
        onClick={() => setShowQuickAdd(true)}
        style={{
          position: 'fixed', bottom: 32, right: 32,
          width: 60, height: 60, borderRadius: '50%',
          background: tokens.colors.yellow,
          border: '3px solid #0A0A0A',
          boxShadow: tokens.shadow.lg,
          cursor: 'pointer', fontSize: 28, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.15s',
          zIndex: 200,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-3px,-3px) rotate(90deg)'; e.currentTarget.style.boxShadow = tokens.shadow.xl; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = tokens.shadow.lg; }}
        title="Add Lead"
      >＋</button>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <AddLeadModal
          onClose={() => setShowQuickAdd(false)}
          onAdded={(lead) => { handleLeadAdded(lead); setShowQuickAdd(false); }}
          toast={addToast}
        />
      )}

      {/* Toasts */}
      <NeoToast toasts={toasts} removeToast={removeToast} />
    </>
  )
}
