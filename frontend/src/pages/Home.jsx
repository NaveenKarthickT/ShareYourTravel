import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HeroCar from "../components/HeroCar.jsx";
import {
  Car, Users2, MapPinned, Shield, Wallet, Route, Sparkles, Star,
  Building2, CalendarCheck, ArrowRight,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const primaryCTA = user ? "/organizations" : "/register";
  const primaryLabel = user ? "Choose your community" : "Get Started";

  return (
    <div className="overflow-hidden">
      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-b from-accent-soft/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm mb-6 animate-fade-up">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Verified communities · Admin-approved access
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight animate-fade-up">
            <span className="text-primary dark:text-sky-300">Vehicle Pooling,</span>
            <br />
            <span className="text-gradient">Community by Community</span>
          </h1>

          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto animate-fade-up">
            Share Your Vehicle connects people within your residency, tech park or company
            into independent, admin-managed pooling communities.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up">
            <Link to={primaryCTA}
              className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition">
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link to="/login"
                className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full px-7 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Login
              </Link>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500 dark:text-slate-400 animate-fade-up">
            <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-accent" /> Verified members only</span>
            <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Rating-based trust</span>
            <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-accent" /> Multi-tenant by design</span>
            <span className="inline-flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-accent" /> Auto trip completion</span>
          </div>

          {/* Animated hero car */}
          <div className="mt-12">
            <HeroCar />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Simple by design</p>
          <h2 className="text-3xl font-bold text-primary dark:text-sky-300">How it works</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            Four easy steps from discovering a community to rating your ride.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Building2, title: "Pick a community", body: "Join a pooling server for your residency or workplace — or start your own." },
            { icon: Shield, title: "Get approved", body: "The community admin reviews and approves your membership request." },
            { icon: Car, title: "Post or search", body: "Offer a seat in your vehicle, or search trips others have posted." },
            { icon: Star, title: "Ride & rate", body: "Book a seat, complete the trip, and leave feedback for the driver." },
          ].map((step, i) => (
            <div key={step.title}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 transition">
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">
                {i + 1}
              </div>
              <div className="relative w-11 h-11 rounded-xl bg-accent-soft dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <step.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="relative font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{step.title}</h3>
              <p className="relative text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WHY ================= */}
      <section className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Built for real communities</p>
            <h2 className="text-3xl font-bold">Why Share Your Vehicle</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Wallet, title: "Save money", body: "Split fuel and toll costs with people on the same route." },
              { icon: Route, title: "Cut congestion", body: "Fewer cars on the road for the same daily commute." },
              { icon: Users2, title: "Ride with your community", body: "Each organization runs its own private, admin-moderated pool." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent mb-3">
          <MapPinned className="w-3.5 h-3.5" /> Multi-tenant by design
        </div>
        <h2 className="text-3xl font-bold text-primary dark:text-sky-300 mb-3">
          Every organization gets its own pooling server
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
          Independent communities — separate users, admins, vehicles, bookings and chats.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {["ABC Residency Pooling", "BA IT Park Pooling", "Green Ride Co", "Metro Poolers"].map((name) => (
            <span key={name}
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              {name}
            </span>
          ))}
        </div>
        <Link to={user ? "/organizations" : "/register"}
          className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition">
          Find or create your community <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
