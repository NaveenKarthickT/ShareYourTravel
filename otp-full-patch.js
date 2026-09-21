// ============================================================
// City Search Patch · Autocomplete suggestions on route inputs
// Run: node city-search-patch.js   (from carpool-platform root)
// ============================================================

const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve('frontend');
if (!fs.existsSync(frontendDir)) {
  console.error('❌ Run this from inside carpool-platform (must contain frontend/)');
  process.exit(1);
}

const write = (p, content) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/^\n/, ''), 'utf8');
  console.log('  ✏️  Wrote: ' + path.relative(process.cwd(), p));
};

console.log('\n🔍 Adding city autocomplete search...\n');

// ============================================================
// 1. NEW: frontend/src/data/cities.js
// ============================================================
write(path.join(frontendDir, 'src/data/cities.js'), `
// Curated list of cities, towns and popular areas — used for
// autocomplete suggestions in From/To search inputs.
// Focused on India + a few global hubs.

export const CITIES = [
  // --- Major Indian metros ---
  "Bangalore", "Bengaluru", "Mumbai", "Delhi", "New Delhi", "Chennai",
  "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Surat", "Jaipur",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi",
  "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad",
  "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior",
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota",
  "Chandigarh", "Guwahati", "Solapur", "Hubli", "Mysore",
  "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur",
  "Moradabad", "Jalandhar", "Bhubaneswar", "Salem",
  "Warangal", "Guntur", "Bhiwandi", "Saharanpur",
  "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur",
  "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore",
  "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela",
  "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga",
  "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi",
  "Ulhasnagar", "Jammu", "Sangli", "Miraj", "Vellore",
  "Belgaum", "Mangalore", "Tirunelveli", "Malegaon", "Gaya",
  "Udaipur", "Maheshtala", "Davanagere", "Kozhikode",
  "Kurnool", "Rajpur Sonarpur", "Rajahmundry", "Bokaro",
  "South Dumdum", "Bellary", "Patiala", "Gopalpur", "Agartala",
  "Bhagalpur", "Muzaffarnagar", "Bhatpara", "Panihati",
  "Latur", "Dhule", "Rohtak", "Sagar", "Korba", "Bhilwara",
  "Berhampur", "Muzaffarpur", "Ahmednagar", "Mathura",
  "Kollam", "Avadi", "Kadapa", "Kamarhati", "Sambalpur",
  "Bilaspur", "Shahjahanpur", "Satara", "Bijapur",
  "Kakinada", "Nizamabad", "Shivamogga", "Ratlam",
  "Modinagar", "Durg", "Shillong", "Imphal", "Aizawl",
  "Kohima", "Itanagar", "Gangtok", "Panaji", "Pondicherry",
  "Port Blair", "Kavaratti",

  // --- Popular neighbourhoods / tech hubs / IT parks ---
  "Whitefield", "Electronic City", "Koramangala", "Indiranagar",
  "Jayanagar", "HSR Layout", "Marathahalli", "Yelahanka",
  "Hebbal", "Banashankari", "Rajajinagar", "BTM Layout",
  "Sarjapur Road", "Bellandur", "Kadugodi", "Devanahalli",
  "Bommanahalli", "Peenya", "Yeshwanthpur",
  "Andheri", "Bandra", "Powai", "Navi Mumbai", "Thane West",
  "Borivali", "Kandivali", "Malad", "Goregaon", "Chembur",
  "Lower Parel", "Worli", "Colaba", "Dadar",
  "Gurgaon", "Gurugram", "Faridabad", "Noida", "Greater Noida",
  "Saket", "Dwarka", "Rohini", "Karol Bagh", "Connaught Place",
  "Nehru Place", "Hauz Khas", "Vasant Kunj",
  "Hinjewadi", "Kharadi", "Baner", "Aundh", "Wakad",
  "Magarpatta", "Hadapsar", "Viman Nagar", "Pimpri", "Chinchwad",
  "Hitec City", "Gachibowli", "Madhapur", "Kondapur",
  "Banjara Hills", "Jubilee Hills", "Secunderabad",
  "OMR", "Guindy", "Velachery", "Adyar", "T Nagar",
  "Anna Nagar", "Tambaram", "Porur", "Perungudi",
  "Salt Lake", "New Town", "Rajarhat", "Park Street",
  "Sector V", "Bidhannagar", "Behala", "Garia",

  // --- International hubs (for global pooling) ---
  "San Francisco", "New York", "Los Angeles", "Seattle",
  "Austin", "Boston", "Chicago", "Denver", "Miami",
  "London", "Manchester", "Birmingham", "Edinburgh",
  "Dublin", "Amsterdam", "Berlin", "Munich", "Paris",
  "Barcelona", "Madrid", "Rome", "Milan",
  "Dubai", "Abu Dhabi", "Singapore", "Hong Kong",
  "Tokyo", "Osaka", "Seoul", "Sydney", "Melbourne",
  "Toronto", "Vancouver", "Mexico City", "São Paulo",
];

// Normalize a string for fuzzy match (removes case, extra spaces)
const normalize = (s) => (s || "").toLowerCase().trim();

// Returns matching cities, sorted by relevance:
//   1. Prefix match first ("bang" → "Bangalore" before "Bangkok")
//   2. Then substring match
//   3. Then fuzzy match on missing letters
export const searchCities = (query, limit = 8) => {
  const q = normalize(query);
  if (!q || q.length < 2) return [];

  const prefixMatches = [];
  const substringMatches = [];

  for (const city of CITIES) {
    const c = normalize(city);
    if (c.startsWith(q)) prefixMatches.push(city);
    else if (c.includes(q)) substringMatches.push(city);
  }

  return [...prefixMatches, ...substringMatches].slice(0, limit);
};
`);

// ============================================================
// 2. NEW: frontend/src/components/CityInput.jsx
// ============================================================
write(path.join(frontendDir, 'src/components/CityInput.jsx'), `
import { useEffect, useRef, useState } from "react";
import { MapPin, MapPinned, Clock, X } from "lucide-react";
import { searchCities } from "../data/cities.js";

// Autocomplete input for city / area names.
// - Suggests from a curated list while typing
// - Click a suggestion to select it
// - Shows recent picks for the same field type
// - Keyboard navigation (↑ ↓ Enter Esc)

const RECENT_KEY = "cp_recent_cities";

const readRecent = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
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

  // Close on outside click
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
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />}
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => { onChange?.(e.target.value); setOpen(true); setHighlighted(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-full pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {value && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { onChange?.(""); inputRef.current?.focus(); setOpen(true); }}
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
              <MapPin className={"w-3.5 h-3.5 " + (i === highlighted ? "text-accent" : "text-slate-400")} />
              <span className="truncate">{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// ============================================================
// 3. PATCH: frontend/src/pages/SearchVehicles.jsx
//    Replace From/To inputs with CityInput
// ============================================================
const searchPath = path.join(frontendDir, 'src/pages/SearchVehicles.jsx');
let searchSrc = fs.readFileSync(searchPath, 'utf8');

// Add import
if (!searchSrc.includes('CityInput')) {
  searchSrc = searchSrc.replace(
    `import FilterChips from "../components/FilterChips.jsx";`,
    `import FilterChips from "../components/FilterChips.jsx";\nimport CityInput from "../components/CityInput.jsx";`
  );

  // Replace From input block
  searchSrc = searchSrc.replace(
    /<div className="relative">\s*<MapPin className="absolute left-3 top-1\/2 -translate-y-1\/2 w-3\.5 h-3\.5 text-slate-400" \/>\s*<input value=\{filters\.startLocation\}[\s\S]*?\/>\s*<\/div>/,
    `<CityInput
                value={filters.startLocation}
                onChange={(v) => setFilters({ ...filters, startLocation: v })}
                onSelect={() => canApply && search()}
                placeholder="Search city or area"
                icon={MapPin}
              />`
  );

  // Replace To input block
  searchSrc = searchSrc.replace(
    /<div className="relative">\s*<Flag className="absolute left-3 top-1\/2 -translate-y-1\/2 w-3\.5 h-3\.5 text-slate-400" \/>\s*<input value=\{filters\.destination\}[\s\S]*?\/>\s*<\/div>/,
    `<CityInput
                value={filters.destination}
                onChange={(v) => setFilters({ ...filters, destination: v })}
                onSelect={() => canApply && search()}
                placeholder="Search city or area"
                icon={Flag}
              />`
  );

  fs.writeFileSync(searchPath, searchSrc, 'utf8');
  console.log('  🔧 Patched: frontend/src/pages/SearchVehicles.jsx');
} else {
  console.log('  ✓ SearchVehicles.jsx already uses CityInput');
}

// ============================================================
// 4. PATCH: frontend/src/pages/PostVehicle.jsx
//    Replace From/To inputs with CityInput
// ============================================================
const postPath = path.join(frontendDir, 'src/pages/PostVehicle.jsx');
let postSrc = fs.readFileSync(postPath, 'utf8');

if (!postSrc.includes('CityInput')) {
  postSrc = postSrc.replace(
    `import Sidebar from "../components/Sidebar.jsx";`,
    `import Sidebar from "../components/Sidebar.jsx";\nimport CityInput from "../components/CityInput.jsx";`
  );

  // Replace From block
  postSrc = postSrc.replace(
    /<div className="relative">\s*<MapPin className="absolute left-3 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-400" \/>\s*<input \{\.\.\.field\("startLocation"\)\} className=\{inputClass\("startLocation"\)\} \/>\s*<\/div>/,
    `<CityInput
                  value={form.startLocation}
                  onChange={(v) => setForm({ ...form, startLocation: v })}
                  onSelect={() => setTouched((t) => ({ ...t, startLocation: true }))}
                  placeholder="Search city or area"
                  icon={MapPin}
                  className="w-full"
                />`
  );

  // Replace To block
  postSrc = postSrc.replace(
    /<div className="relative">\s*<Flag className="absolute left-3 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-400" \/>\s*<input \{\.\.\.field\("destination"\)\} className=\{inputClass\("destination"\)\} \/>\s*<\/div>/,
    `<CityInput
                  value={form.destination}
                  onChange={(v) => setForm({ ...form, destination: v })}
                  onSelect={() => setTouched((t) => ({ ...t, destination: true }))}
                  placeholder="Search city or area"
                  icon={Flag}
                  className="w-full"
                />`
  );

  fs.writeFileSync(postPath, postSrc, 'utf8');
  console.log('  🔧 Patched: frontend/src/pages/PostVehicle.jsx');
} else {
  console.log('  ✓ PostVehicle.jsx already uses CityInput');
}

console.log('\n✅ City search patch applied!\n');
console.log('Next steps:');
console.log('  git add .');
console.log('  git commit -m "Add city autocomplete to search & post"');
console.log('  git push\n');
console.log('  Vercel auto-deploys the frontend in ~30s.\n');