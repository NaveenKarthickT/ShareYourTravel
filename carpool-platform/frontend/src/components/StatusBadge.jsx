const STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  available: "bg-emerald-100 text-emerald-700",
  full: "bg-slate-200 text-slate-700",
  requested: "bg-amber-100 text-amber-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  ongoing: "bg-orange-100 text-orange-700",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}
