import { Sparkles } from "lucide-react";

export default function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  action,
  accent = "accent",
}) {
  const bgMap = {
    accent: "from-accent-soft via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950",
    primary: "from-primary/5 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950",
  };
  const iconBgMap = {
    accent: "bg-accent-soft dark:bg-slate-800 text-accent",
    primary: "bg-primary/10 dark:bg-slate-800 text-primary dark:text-sky-300",
  };

  return (
    <section className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${bgMap[accent]} mb-8`}>
      {/* ambient blobs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row sm:items-center gap-5">
        {Icon && (
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${iconBgMap[accent]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-accent mb-2">
              <Sparkles className="w-3 h-3" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-sky-300 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
