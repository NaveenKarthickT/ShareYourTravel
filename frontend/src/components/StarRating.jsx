import { Star } from "lucide-react";

export default function StarRating({ value = 0, count, size = 16, showCount = true }) {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Star className="w-3.5 h-3.5" /> No ratings yet
      </span>
    );
  }
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {stars.map((s) => (
          <Star key={s} style={{ width: size, height: size }}
            className={s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
        ))}
      </span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{value.toFixed(1)}</span>
      {showCount && count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </span>
  );
}
