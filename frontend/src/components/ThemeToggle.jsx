import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/10 dark:border-slate-800 bg-white/10 dark:bg-slate-900 text-white/90 dark:text-amber-300 hover:bg-white/20 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-sm ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-amber-300 transition-all duration-300 absolute ${
            isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-sky-200 transition-all duration-300 absolute ${
            isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </div>
    </button>
  );
}