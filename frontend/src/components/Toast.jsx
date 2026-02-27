import { useEffect } from 'react';
export function Toast({ msg, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  const bg = type === 'error' ? 'bg-red-500' : 'bg-emerald-500';
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium`}>
      <span>{type === 'error' ? '✗' : '✓'}</span> {msg}
    </div>
  );
}
