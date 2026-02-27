import { useState } from 'react'
import { NeoModal, NeoButton, NeoInput, NeoSelect, tokens } from './neo/NeoDesignSystem.jsx'
import { api } from '../api/index.js'

const STATES = ['Maharashtra','Karnataka','Kerala','Tamil Nadu','Telangana','Andhra Pradesh','Rajasthan','Gujarat','West Bengal','Punjab','Goa','Delhi','Uttar Pradesh','Madhya Pradesh']
const SOURCES = ['Meta Forms','Reels','Story','WhatsApp','Website','Referral','Manual']

export function AddLeadModal({ onClose, onAdded, toast }) {
  const [form, setForm]     = useState({ name: '', phone: '', source: 'Meta Forms', city: '', state: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [errors,  setErrors]  = useState({})

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (form.phone && form.phone.replace(/\D/g,'').length < 10) e.phone = 'Enter a valid 10-digit phone'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const data = await api.addLead(form)
      setResult(data)
      onAdded(data.lead)
      toast(`Lead assigned to ${data.assigned_to || 'queue'}!`)
    } catch(e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <NeoModal open title="Add New Lead" onClose={onClose} width={500}>
      {result ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 20, margin: '0 0 8px' }}>Lead Added!</h3>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#555', margin: '0 0 6px' }}>
            Assigned to <strong style={{ color: tokens.colors.black }}>{result.assigned_to || 'Unassigned'}</strong>
          </p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#999', margin: '0 0 20px' }}>
            Reason: {result.reason}
          </p>
          <NeoButton onClick={onClose} color={tokens.colors.black} textColor={tokens.colors.yellow}>Done</NeoButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NeoInput label="Name" value={form.name} onChange={f('name')} placeholder="Rahul Mehta" />
            <NeoInput label="Phone *" value={form.phone} onChange={f('phone')} placeholder="9876543210" error={errors.phone} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NeoSelect label="Source" value={form.source} onChange={f('source')} options={SOURCES.map(s => ({ value: s, label: s }))} />
            <NeoSelect label="State" value={form.state} onChange={f('state')} options={[{ value: '', label: 'Select state…' }, ...STATES.map(s => ({ value: s, label: s }))]} />
          </div>
          <NeoInput label="City" value={form.city} onChange={f('city')} placeholder="Mumbai" />
          <NeoInput label="Notes" value={form.notes} onChange={f('notes')} placeholder="Optional notes…" />
          <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '2px solid #E8E3D9' }}>
            <NeoButton onClick={submit} disabled={loading} color={tokens.colors.yellow} icon={loading ? '…' : '⚡'}>
              {loading ? 'Assigning…' : 'Add & Auto-Assign'}
            </NeoButton>
            <NeoButton onClick={onClose} color={tokens.colors.white}>Cancel</NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  )
}
