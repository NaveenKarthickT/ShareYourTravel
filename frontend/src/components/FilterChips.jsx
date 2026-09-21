import { X } from "lucide-react";

export default function FilterChips({ filters, labels, onRemove, onClearAll }) {
  const active = Object.entries(filters).filter(([_, v]) => v);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filters:</span>
      {active.map(([key, value]) => (
        <button key={key} onClick={() => onRemove(key)}
          className="inline-flex items-center gap-1.5 bg-accent-soft border border-accent/30 text-primary text-xs font-medium px-2.5 py-1 rounded-full hover:bg-accent/20 transition">
          <span className="text-slate-500">{labels[key] || key}:</span>
          <span>{value}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
      {active.length > 1 && (
        <button onClick={onClearAll} className="text-xs text-rose-600 hover:underline ml-1 font-medium">Clear all</button>
      )}
    </div>
  );
}
