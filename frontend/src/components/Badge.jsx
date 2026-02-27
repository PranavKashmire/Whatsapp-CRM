export function Badge({ label, color = 'blue' }) {
  const colors = {
    blue:   'bg-sky-900/60 text-sky-300 border-sky-700',
    green:  'bg-emerald-900/60 text-emerald-300 border-emerald-700',
    amber:  'bg-amber-900/60 text-amber-300 border-amber-700',
    red:    'bg-red-900/60 text-red-300 border-red-700',
    purple: 'bg-violet-900/60 text-violet-300 border-violet-700',
    gray:   'bg-zinc-800 text-zinc-400 border-zinc-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}
