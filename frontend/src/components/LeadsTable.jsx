import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { Badge } from './Badge.jsx';

const SOURCE_COLOR = { 'Meta Forms': 'blue', 'Reels': 'purple', 'Story': 'amber' };

export function LeadsTable({ refreshTick }) {
  const [leads, setLeads]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterState, setFilterState]   = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [newIds, setNewIds]   = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)      params.search = search;
      if (filterState) params.state  = filterState;
      if (filterSource) params.source = filterSource;
      const data = await api.getLeads(params);
      setLeads(data.leads);
      setTotal(data.total);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterState, filterSource]);

  useEffect(() => { load(); }, [load, refreshTick]);

  // Highlight newly arrived leads
  const markNew = (id) => {
    setNewIds(s => new Set([...s, id]));
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n; }), 4000);
  };

  const states  = [...new Set(leads.map(l => l.state))].filter(Boolean).sort();
  const sources = [...new Set(leads.map(l => l.source))].filter(Boolean).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, phone, city..."
          className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 flex-1 min-w-48" />
        <select value={filterState} onChange={e => setFilterState(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All States</option>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Sources</option>
          {sources.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-zinc-500">{total} leads</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              {['Name','Phone','Location','Source','Time','Assigned To','Notes'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading && (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Loading...</td></tr>
            )}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-600">No leads found</td></tr>
            )}
            {leads.map(lead => {
              const ts = new Date(lead.timestamp || lead.created_at);
              const isNew = newIds.has(lead.id);
              return (
                <tr key={lead.id}
                  className={`transition-all hover:bg-zinc-800/40 ${isNew ? 'bg-emerald-950/30 border-l-2 border-emerald-500' : ''}`}>
                  <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <div className="text-white text-xs">{lead.city}</div>
                    <div className="text-zinc-500 text-xs">{lead.state}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={lead.source} color={SOURCE_COLOR[lead.source] || 'gray'} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs tabular-nums">
                    {ts.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                    <div className="text-zinc-600">{ts.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                  </td>
                  <td className="px-4 py-3">
                    {lead.caller_name ? (
                      <div>
                        <div className="text-sky-400 text-xs font-medium">{lead.caller_name}</div>
                        <div className="text-zinc-600 text-xs">{lead.caller_role}</div>
                      </div>
                    ) : <span className="text-red-400 text-xs">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-[140px] truncate">{lead.notes || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
