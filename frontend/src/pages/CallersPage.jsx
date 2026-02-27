import { useState } from 'react'
import { NeoCard, NeoButton, NeoBadge, NeoModal, NeoInput, NeoSelect, NeoProgress, NeoTag, tokens } from '../components/neo/NeoDesignSystem.jsx'
import { api } from '../api/index.js'

const ALL_LANGS   = ['Hindi','English','Marathi','Kannada','Telugu','Tamil','Malayalam','Bengali','Gujarati','Punjabi']
const ALL_STATES  = ['Maharashtra','Karnataka','Kerala','Tamil Nadu','Telangana','Andhra Pradesh','Rajasthan','Gujarat','West Bengal','Punjab','Goa','Delhi','Uttar Pradesh','Madhya Pradesh']
const ALL_ROLES   = ['Senior Caller','Caller','Junior Caller','Team Lead']

function TagToggleGroup({ items, selected, onToggle, color }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => (
        <button key={item} onClick={() => onToggle(item)}
          style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            border: '2px solid #0A0A0A',
            borderRadius: 4,
            background: selected.includes(item) ? color : tokens.colors.white,
            color: tokens.colors.black,
            cursor: 'pointer',
            boxShadow: selected.includes(item) ? '2px 2px 0 #0A0A0A' : 'none',
            transition: 'all 0.1s',
          }}
        >{item}</button>
      ))}
    </div>
  )
}

function CallerFormBody({ form, setForm }) {
  const toggle = (field, val) => setForm(f => ({
    ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <NeoInput label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ravi Kumar" />
        <NeoSelect label="Role" value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          options={ALL_ROLES.map(r => ({ value: r, label: r }))} />
      </div>

      <div>
        <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
          Daily Lead Limit: <span style={{ color: tokens.colors.pink }}>{form.daily_limit}</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={10} max={120} step={5} value={form.daily_limit}
            onChange={e => setForm(f => ({ ...f, daily_limit: +e.target.value }))}
            style={{ flex: 1, accentColor: tokens.colors.black }} />
          <div style={{
            background: tokens.colors.yellow, border: '2px solid #0A0A0A', borderRadius: 4,
            padding: '4px 10px', fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 16, minWidth: 44, textAlign: 'center',
            boxShadow: '2px 2px 0 #0A0A0A',
          }}>{form.daily_limit}</div>
        </div>
      </div>

      <div>
        <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
          Languages Known
        </label>
        <TagToggleGroup items={ALL_LANGS} selected={form.languages || []} onToggle={v => toggle('languages', v)} color={tokens.colors.cyan} />
      </div>

      <div>
        <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
          Assigned States
        </label>
        <TagToggleGroup items={ALL_STATES} selected={form.assigned_states || []} onToggle={v => toggle('assigned_states', v)} color={tokens.colors.lime} />
        {(form.assigned_states || []).length === 0 && (
          <p style={{ margin: '6px 0 0', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#888' }}>
            No states → caller in global pool
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active</label>
        <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
          style={{
            width: 48, height: 26, borderRadius: 13, border: '2px solid #0A0A0A',
            background: form.active ? tokens.colors.lime : '#ccc',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}>
          <span style={{
            position: 'absolute', top: 3, left: form.active ? 24 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: tokens.colors.black, transition: 'left 0.2s',
          }} />
        </button>
        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: form.active ? '#22c55e' : '#999', fontWeight: 700 }}>
          {form.active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
    </div>
  )
}

function CallerCard({ caller, onEdit, totalLeads }) {
  const isCapped = (caller.leads_today || 0) >= caller.daily_limit
  const workloadPct = Math.min(((caller.leads_today || 0) / caller.daily_limit) * 100, 100)
  const accentColor = isCapped ? tokens.colors.pink : workloadPct >= 80 ? tokens.colors.orange : tokens.colors.lime

  return (
    <NeoCard color={tokens.colors.white} accent={accentColor} className="p-5">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, background: tokens.colors.black,
            border: '3px solid #0A0A0A', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 18, color: tokens.colors.yellow,
            flexShrink: 0,
          }}>
            {caller.name[0]}
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15 }}>{caller.name}</div>
            <div style={{ fontSize: 11, color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>{caller.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isCapped && <NeoBadge label="CAPPED" color={tokens.colors.pink} textColor="#fff" />}
          {!caller.active && <NeoBadge label="INACTIVE" color="#ccc" />}
        </div>
      </div>

      {/* Workload bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>Daily Workload</span>
          <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{caller.leads_today || 0}/{caller.daily_limit}</span>
        </div>
        <NeoProgress value={caller.leads_today || 0} max={caller.daily_limit} />
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(caller.languages || []).map(l => <NeoTag key={l} label={l} color={tokens.colors.cyan} />)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(caller.assigned_states || []).map(s => <NeoTag key={s} label={s} color={tokens.colors.lime} />)}
          {(caller.assigned_states || []).length === 0 && <NeoTag label="GLOBAL POOL" color={tokens.colors.gray} />}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #E8E3D9' }}>
        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#999' }}>{totalLeads} total assigned</span>
        <NeoButton size="sm" onClick={() => onEdit(caller)} color={tokens.colors.black} textColor={tokens.colors.yellow}>Edit</NeoButton>
      </div>
    </NeoCard>
  )
}

export function CallersPage({ callers, setCallers, leads, toast }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({ name: '', role: 'Caller', languages: [], assigned_states: [], daily_limit: 50, active: true })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', role: 'Caller', languages: [], assigned_states: [], daily_limit: 50, active: true })
    setShowModal(true)
  }
  const openEdit = (caller) => {
    setEditing(caller)
    setForm({ name: caller.name, role: caller.role, languages: caller.languages || [], assigned_states: caller.assigned_states || [], daily_limit: caller.daily_limit, active: caller.active })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        const data = await api.updateCaller(editing.id, form)
        setCallers(cs => cs.map(c => c.id === editing.id ? { ...c, ...data.caller } : c))
        toast('Caller updated!')
      } else {
        const data = await api.addCaller(form)
        setCallers(cs => [...cs, { ...data.caller, leads_today: 0, total_leads_assigned: 0 }])
        toast('Caller added!')
      }
      setShowModal(false)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em' }}>Sales Callers</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
            {callers.filter(c => c.active).length} active · {callers.filter(c => (c.leads_today||0) >= c.daily_limit).length} capped today
          </p>
        </div>
        <NeoButton onClick={openAdd} color={tokens.colors.yellow} icon="＋">Add Caller</NeoButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {callers.map(caller => (
          <CallerCard
            key={caller.id}
            caller={caller}
            onEdit={openEdit}
            totalLeads={leads.filter(l => l.assigned_caller_id === caller.id).length}
          />
        ))}
        {callers.length === 0 && (
          <NeoCard color={tokens.colors.offwhite} className="p-8" hover={false}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>No callers yet</div>
              <div style={{ fontSize: 13, color: '#888', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 16 }}>Add your first sales caller to start assigning leads</div>
              <NeoButton onClick={openAdd} color={tokens.colors.yellow} icon="＋">Add First Caller</NeoButton>
            </div>
          </NeoCard>
        )}
      </div>

      <NeoModal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Caller' : 'Add New Caller'} width={580}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CallerFormBody form={form} setForm={setForm} />
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '2px solid #E8E3D9' }}>
            <NeoButton onClick={handleSave} disabled={saving} color={tokens.colors.black} textColor={tokens.colors.yellow}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Caller'}
            </NeoButton>
            <NeoButton onClick={() => setShowModal(false)} color={tokens.colors.white}>Cancel</NeoButton>
          </div>
        </div>
      </NeoModal>
    </div>
  )
}
