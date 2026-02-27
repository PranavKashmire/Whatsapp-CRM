const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getLeads:     (params) => req('/leads?' + new URLSearchParams(params || {})),
  getStats:     ()       => req('/leads/stats'),
  addLead:      (body)   => req('/leads/manual', { method: 'POST', body }),
  getCallers:   ()       => req('/callers'),
  addCaller:    (body)   => req('/callers', { method: 'POST', body }),
  updateCaller: (id, b)  => req('/callers/' + id, { method: 'PATCH', body: b }),
  deleteCaller: (id)     => req('/callers/' + id, { method: 'DELETE' }),
  triggerSync:  ()       => req('/sync', { method: 'POST' }),
};
