import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
            Vehicle Pooling, <span className="text-brand-600">Community by Community</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            PoolTogether connects people within your residency, tech park or company into
            independent, admin-managed pooling communities — so you always ride with people you trust.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {user ? (
              <Link to="/organizations" className="px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700">
                Choose your community
              </Link>
            ) : (
              <>
                <Link to="/register" className="px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700">
                  Get Started
                </Link>
                <Link to="/login" className="px-6 py-3 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ["1. Pick a community", "Join an existing pooling server for your residency or workplace, or start a new one."],
            ["2. Get approved", "The community admin reviews and approves your membership request."],
            ["3. Post or search", "Offer a seat in your vehicle, or search trips others have posted."],
            ["4. Ride & rate", "Book a seat, complete the trip, and leave feedback for the driver."],
          ].map(([title, body]) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-brand-700 mb-2">{title}</h3>
              <p className="text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid sm:grid-cols-3 gap-8 text-center">
          {[
            ["Save money", "Split fuel and toll costs with people on the same route."],
            ["Cut congestion", "Fewer vehicles on the road for the same commute."],
            ["Ride with your community", "Every organization has its own private, admin-moderated pool."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-slate-300 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Every organization gets its own pooling server</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-6">
          e.g. "ABC Residency Pooling" and "BA IT Park Pooling" run as fully independent
          communities — separate users, admins, vehicles and trips.
        </p>
        <Link to={user ? "/organizations" : "/register"} className="px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 inline-block">
          Find or create your community
        </Link>
      </section>
    </div>
  );
}
