import { useState } from 'react';

const ALL_LANGS   = ['Hindi','English','Marathi','Kannada','Telugu','Tamil','Malayalam','Bengali','Gujarati','Punjabi'];
const ALL_STATES  = ['Maharashtra','Karnataka','Kerala','Tamil Nadu','Telangana','Andhra Pradesh','Rajasthan','Gujarat','West Bengal','Punjab','Goa','Delhi','Uttar Pradesh','Madhya Pradesh'];
const ALL_ROLES   = ['Senior Caller','Caller','Junior Caller','Team Lead'];

export function CallerForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    name: '', role: 'Caller', languages: [], assigned_states: [], daily_limit: 50, active: true
  });
  const [err, setErr] = useState('');

  const toggle = (field, val) => setForm(f => ({
    ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
  }));

  const submit = () => {
    if (!form.name.trim()) { setErr('Name is required'); return; }
    setErr('');
    onSave(form);
  };

  return (
    <div className="space-y-4">
      {err && <div className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{err}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Full Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
            placeholder="e.g. Ravi Kumar" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Role</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
            {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
          Daily Lead Limit: <span className="text-sky-400 font-bold">{form.daily_limit}</span>
        </label>
        <input type="range" min="10" max="120" step="5" value={form.daily_limit}
          onChange={e => setForm(f => ({ ...f, daily_limit: +e.target.value }))}
          className="w-full" />
        <div className="flex justify-between text-xs text-zinc-600 mt-1"><span>10</span><span>120</span></div>
      </div>

      <div>
        <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Languages Known</label>
        <div className="flex flex-wrap gap-2">
          {ALL_LANGS.map(l => (
            <button key={l} onClick={() => toggle('languages', l)} type="button"
              className={`text-xs px-3 py-1 rounded-full border transition-all ${form.languages.includes(l) ? 'bg-sky-600 border-sky-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Assigned States</label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATES.map(s => (
            <button key={s} onClick={() => toggle('assigned_states', s)} type="button"
              className={`text-xs px-3 py-1 rounded-full border transition-all ${form.assigned_states.includes(s) ? 'bg-violet-700 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
              {s}
            </button>
          ))}
        </div>
        {form.assigned_states.length === 0 && <p className="text-xs text-zinc-600 mt-1">No states selected → caller is in global pool</p>}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-zinc-400 uppercase tracking-wider">Status</label>
        <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} type="button"
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${form.active ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${form.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-xs text-zinc-400">{form.active ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={loading} type="button"
          className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          {loading && <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block" />}
          {initial ? 'Save Changes' : 'Add Caller'}
        </button>
        <button onClick={onCancel} type="button" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
