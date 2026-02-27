// ═══════════════════════════════════════════════════════════════
//  NEO-BRUTALIST DESIGN SYSTEM — Bloc CRM
//  Tokens, base components, animations
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'

// ─── Design Tokens ────────────────────────────────────────────
export const tokens = {
  colors: {
    yellow:  '#FFE135',
    lime:    '#B8FF57',
    cyan:    '#00D4FF',
    pink:    '#FF3CAC',
    orange:  '#FF6B2B',
    black:   '#0A0A0A',
    white:   '#FAFAFA',
    offwhite:'#F5F0E8',
    gray:    '#E8E3D9',
    darkgray:'#2A2A2A',
  },
  shadow: {
    sm:  '3px 3px 0px #0A0A0A',
    md:  '5px 5px 0px #0A0A0A',
    lg:  '8px 8px 0px #0A0A0A',
    xl:  '12px 12px 0px #0A0A0A',
    colored: (color) => `5px 5px 0px ${color}`,
  },
  border: '3px solid #0A0A0A',
  borderThin: '2px solid #0A0A0A',
  radius: { sm: '4px', md: '8px', lg: '12px' },
}

// ─── NeoCard ──────────────────────────────────────────────────
export function NeoCard({ children, className = '', color = tokens.colors.white, accent, onClick, hover = true }) {
  return (
    <div
      onClick={onClick}
      className={`relative ${onClick || hover ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: color,
        border: tokens.border,
        borderRadius: tokens.radius.md,
        boxShadow: tokens.shadow.md,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => { if (hover) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = tokens.shadow.lg; } }}
      onMouseLeave={e => { if (hover) { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = tokens.shadow.md; } }}
    >
      {accent && (
        <div style={{ position: 'absolute', top: -1, left: 16, width: 48, height: 4, background: accent, borderRadius: '0 0 4px 4px' }} />
      )}
      {children}
    </div>
  )
}

// ─── NeoButton ────────────────────────────────────────────────
export function NeoButton({ children, onClick, color = tokens.colors.yellow, textColor = tokens.colors.black, size = 'md', disabled, icon, className = '' }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-bold ${sizes[size]} ${className}`}
      style={{
        background: disabled ? '#ccc' : color,
        color: textColor,
        border: tokens.border,
        borderRadius: tokens.radius.sm,
        boxShadow: disabled ? 'none' : tokens.shadow.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Syne', sans-serif",
        letterSpacing: '0.02em',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = tokens.shadow.md; } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = tokens.shadow.sm; } }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'translate(2px,2px)'; }}
      onMouseUp={e => { if (!disabled) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; } }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

// ─── NeoInput ─────────────────────────────────────────────────
export function NeoInput({ label, value, onChange, placeholder, type = 'text', error, className = '' }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  // Shake on error
  useEffect(() => {
    if (error && inputRef.current) {
      inputRef.current.style.animation = 'neoShake 0.4s ease'
      const t = setTimeout(() => { if (inputRef.current) inputRef.current.style.animation = '' }, 400)
      return () => clearTimeout(t)
    }
  }, [error])

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.colors.black }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: tokens.colors.white,
          border: error ? '3px solid #FF3CAC' : focused ? `3px solid ${tokens.colors.cyan}` : tokens.border,
          borderRadius: tokens.radius.sm,
          boxShadow: focused ? `3px 3px 0px ${tokens.colors.cyan}` : tokens.shadow.sm,
          padding: '10px 14px',
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          color: tokens.colors.black,
          outline: 'none',
          width: '100%',
          transition: 'border 0.15s, box-shadow 0.15s',
        }}
      />
      {error && <span style={{ color: tokens.colors.pink, fontSize: 11, fontWeight: 600 }}>{error}</span>}
    </div>
  )
}

// ─── NeoSelect ────────────────────────────────────────────────
export function NeoSelect({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          background: tokens.colors.white,
          border: tokens.border,
          borderRadius: tokens.radius.sm,
          boxShadow: tokens.shadow.sm,
          padding: '10px 14px',
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          color: tokens.colors.black,
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M0 0l6 8 6-8z' fill='%230A0A0A'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── NeoBadge ─────────────────────────────────────────────────
export function NeoBadge({ label, color = tokens.colors.yellow, textColor = tokens.colors.black, size = 'sm' }) {
  return (
    <span
      style={{
        background: color,
        color: textColor,
        border: '2px solid #0A0A0A',
        borderRadius: tokens.radius.sm,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? 10 : 12,
        fontWeight: 800,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        boxShadow: '2px 2px 0px #0A0A0A',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

// ─── NeoProgress ──────────────────────────────────────────────
export function NeoProgress({ value, max, color = tokens.colors.lime }) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = pct >= 100 ? tokens.colors.pink : pct >= 80 ? tokens.colors.orange : color
  return (
    <div style={{ border: tokens.borderThin, borderRadius: tokens.radius.sm, background: tokens.colors.offwhite, height: 14, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: barColor,
        borderRight: pct < 100 ? '2px solid #0A0A0A' : 'none',
        transition: 'width 0.4s ease',
        position: 'relative',
      }} />
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: tokens.colors.black,
        mixBlendMode: 'multiply',
      }}>
        {value}/{max}
      </span>
    </div>
  )
}

// ─── NeoTag ───────────────────────────────────────────────────
export function NeoTag({ label, onRemove, color = tokens.colors.gray }) {
  return (
    <span style={{
      background: color, border: '2px solid #0A0A0A', borderRadius: 4,
      padding: '2px 8px', fontSize: 11, fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {label}
      {onRemove && <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 900, padding: 0, lineHeight: 1 }}>×</button>}
    </span>
  )
}

// ─── NeoToast ─────────────────────────────────────────────────
export function NeoToast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id}
          style={{
            background: t.type === 'success' ? tokens.colors.lime : t.type === 'error' ? tokens.colors.pink : tokens.colors.yellow,
            border: tokens.border, borderRadius: tokens.radius.md,
            boxShadow: tokens.shadow.lg,
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
            color: tokens.colors.black,
            animation: 'neoSlideIn 0.25s ease',
            minWidth: 260, maxWidth: 360,
          }}
        >
          <span style={{ fontSize: 18 }}>{t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : '⚡'}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ─── NeoModal ─────────────────────────────────────────────────
export function NeoModal({ open, onClose, title, children, width = 540 }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.65)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'relative', width: `min(${width}px, 95vw)`,
        background: tokens.colors.offwhite,
        border: tokens.border, borderRadius: tokens.radius.lg,
        boxShadow: tokens.shadow.xl,
        animation: 'neoSlideIn 0.2s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: tokens.border,
          background: tokens.colors.yellow,
          borderRadius: `${tokens.radius.lg} ${tokens.radius.lg} 0 0`,
        }}>
          <h2 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: tokens.colors.black }}>{title}</h2>
          <button onClick={onClose} style={{
            background: tokens.colors.black, color: tokens.colors.white,
            border: 'none', borderRadius: 4, width: 32, height: 32,
            cursor: 'pointer', fontSize: 18, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── NeoTabs ──────────────────────────────────────────────────
export function NeoTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, border: tokens.border, borderRadius: tokens.radius.sm, overflow: 'hidden', width: 'fit-content', boxShadow: tokens.shadow.sm }}>
      {tabs.map((tab, i) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          style={{
            padding: '8px 20px', fontSize: 12, fontWeight: 800,
            fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em',
            textTransform: 'uppercase', cursor: 'pointer', border: 'none',
            borderRight: i < tabs.length - 1 ? tokens.border : 'none',
            background: active === tab.id ? tokens.colors.black : tokens.colors.white,
            color: active === tab.id ? tokens.colors.yellow : tokens.colors.black,
            transition: 'background 0.15s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────
export function NeoSkeleton({ width = '100%', height = 20, className = '' }) {
  return (
    <div className={className} style={{
      width, height, background: 'linear-gradient(90deg, #E8E3D9 25%, #F5F0E8 50%, #E8E3D9 75%)',
      backgroundSize: '200% 100%',
      animation: 'neoSkeleton 1.4s infinite',
      border: '2px solid #0A0A0A', borderRadius: 4,
    }} />
  )
}

export default {}
