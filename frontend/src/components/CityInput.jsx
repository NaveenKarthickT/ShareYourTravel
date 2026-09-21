import { useEffect, useRef, useState } from "react";
import { MapPin, MapPinned, Clock, X } from "lucide-react";
import { searchCities } from "../data/cities.js";

const RECENT_KEY = "cp_recent_cities";

const readRecent = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const pushRecent = (city) => {
  if (!city) return;
  try {
    const recent = readRecent().filter((c) => c !== city);
    recent.unshift(city);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
  } catch {}
};

export default function CityInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search city or area",
  icon: Icon = MapPin,
  id,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [recent, setRecent] = useState([]);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = searchCities(value || "", 8);
  const showRecent = !value && recent.length > 0;
  const items = showRecent ? recent : suggestions;

  const select = (city) => {
    onChange?.(city);
    onSelect?.(city);
    pushRecent(city);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && items[highlighted]) {
        e.preventDefault();
        select(items[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div ref={wrapRef} className={"relative " + className}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-full pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {value && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              onChange?.("");
              inputRef.current?.focus();
              setOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
            aria-label="Clear"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (items.length > 0 || showRecent) && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-64 overflow-y-auto py-1">
          {showRecent && (
            <div className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent
            </div>
          )}
          {!showRecent && suggestions.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <MapPinned className="w-3 h-3" /> Suggestions
            </div>
          )}
          {items.map((city, i) => (
            <button
              key={city}
              type="button"
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => select(city)}
              className={
                "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition " +
                (i === highlighted
                  ? "bg-accent-soft dark:bg-slate-800 text-primary dark:text-sky-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")
              }
            >
              <MapPin
                className={
                  "w-3.5 h-3.5 " + (i === highlighted ? "text-accent" : "text-slate-400")
                }
              />
              <span className="truncate">{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
