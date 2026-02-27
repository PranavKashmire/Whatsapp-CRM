import { tokens } from './NeoDesignSystem.jsx'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',       icon: '⬛' },
  { id: 'leads',       label: 'Leads',            icon: '📥' },
  { id: 'callers',     label: 'Sales Callers',    icon: '👤' },
  { id: 'assignments', label: 'Assignment Logs',  icon: '🤖' },
  { id: 'settings',    label: 'Settings',         icon: '⚙️' },
]

export function NeoSidebar({ active, onNav, collapsed, onToggle, liveStatus }) {
  return (
    <aside style={{
      width: collapsed ? 72 : 240,
      minHeight: '100vh',
      background: tokens.colors.black,
      borderRight: '3px solid #0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 16px' : '20px 24px',
        borderBottom: '3px solid #333',
        display: 'flex', alignItems: 'center', gap: 10,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: tokens.colors.yellow,
          border: '3px solid #0A0A0A',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 16,
          boxShadow: '3px 3px 0px #FFE135',
          color: tokens.colors.black,
        }}>B</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 16, color: tokens.colors.white, letterSpacing: '-0.02em' }}>
              BLOC
            </div>
            <div style={{ fontSize: 9, color: '#666', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}>
              CRM v1.0
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '12px' : '12px 16px',
                borderRadius: tokens.radius.sm,
                border: isActive ? '2px solid #FFE135' : '2px solid transparent',
                background: isActive ? tokens.colors.yellow : 'transparent',
                color: isActive ? tokens.colors.black : '#888',
                fontFamily: "'Syne', sans-serif",
                fontWeight: isActive ? 800 : 600,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                justifyContent: collapsed ? 'center' : 'flex-start',
                overflow: 'hidden',
                boxShadow: isActive ? '3px 3px 0px rgba(255,225,53,0.4)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; } }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Live Status */}
      {!collapsed && (
        <div style={{
          margin: '0 12px 16px',
          padding: '10px 14px',
          background: '#111',
          border: '2px solid #333',
          borderRadius: tokens.radius.sm,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: liveStatus === 'live' ? tokens.colors.lime : '#555',
              boxShadow: liveStatus === 'live' ? `0 0 8px ${tokens.colors.lime}` : 'none',
              animation: liveStatus === 'live' ? 'neoPulse 2s infinite' : 'none',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, color: liveStatus === 'live' ? tokens.colors.lime : '#555', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
              {liveStatus === 'live' ? 'LIVE SYNC' : 'CONNECTING'}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button onClick={onToggle} style={{
        position: 'absolute', right: -16, top: 24,
        width: 32, height: 32,
        background: tokens.colors.yellow,
        border: tokens.border, borderRadius: '50%',
        cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: tokens.shadow.sm, fontWeight: 900,
        zIndex: 10,
      }}>
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  )
}
