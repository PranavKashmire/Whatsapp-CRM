import { Badge } from './Badge.jsx';
import { CapBar } from './CapBar.jsx';

export function CallerCard({ caller, onEdit, onDeactivate }) {
  const isCapped = caller.leads_today >= caller.daily_limit;

  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 space-y-3 transition-all hover:border-zinc-600 ${isCapped ? 'border-red-800/60' : 'border-zinc-800'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${caller.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            <span className="font-semibold text-white text-sm">{caller.name}</span>
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 ml-4">{caller.role}</div>
        </div>
        <div className="flex items-center gap-2">
          {isCapped && <Badge label="Capped" color="red" />}
          {!caller.active && <Badge label="Inactive" color="gray" />}
          <button onClick={() => onEdit(caller)} className="text-xs text-zinc-600 hover:text-sky-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800">
            Edit
          </button>
        </div>
      </div>

      <CapBar used={caller.leads_today || 0} limit={caller.daily_limit} />

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {(caller.languages || []).map(l => <Badge key={l} label={l} color="blue" />)}
        </div>
        <div className="flex flex-wrap gap-1">
          {(caller.assigned_states || []).map(s => <Badge key={s} label={s} color="purple" />)}
          {(caller.assigned_states || []).length === 0 && <Badge label="Global Pool" color="gray" />}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-zinc-600">{caller.total_leads_assigned || 0} total assigned</span>
      </div>
    </div>
  );
}
