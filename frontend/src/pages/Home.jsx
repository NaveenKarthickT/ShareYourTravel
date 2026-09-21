import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  return (
    <div>
      <section className="bg-gradient-to-b from-accent-soft to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary dark:text-sky-300 leading-tight">
            Vehicle Pooling, <span className="text-accent">Community by Community</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            ShareYourVehicle connects people within your residency, tech park or company into independent, admin-managed pooling communities.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {user ? (
              <Link to="/organizations" className="btn btn-primary">Choose your community</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
                <Link to="/login" className="btn btn-outline">Login</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10 text-primary dark:text-sky-300">How it works</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ["1. Pick a community", "Join an existing pooling server for your residency or workplace, or start a new one."],
            ["2. Get approved", "The community admin reviews and approves your membership request."],
            ["3. Post or search", "Offer a seat in your vehicle, or search trips others have posted."],
            ["4. Ride & rate", "Book a seat, complete the trip, and leave feedback for the driver."],
          ].map(([title, body]) => (
            <div key={title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-primary dark:text-sky-300 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid sm:grid-cols-3 gap-8 text-center">
          {[
            ["Save money", "Split fuel and toll costs with people on the same route."],
            ["Cut congestion", "Fewer vehicles on the road for the same commute."],
            ["Ride with your community", "Every organization has its own private, admin-moderated pool."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-white/70 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3 text-primary dark:text-sky-300">Every organization gets its own pooling server</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
          Independent communities — separate users, admins, vehicles and trips.
        </p>
        <Link to={user ? "/organizations" : "/register"} className="btn btn-primary inline-block">
          Find or create your community
        </Link>
      </section>
    </div>
  );
}
