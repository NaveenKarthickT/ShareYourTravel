import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function Feedback() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await api.post("/feedback", { bookingId, rating, comment });
      navigate("/trips/completed");
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Rate your trip</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-md border text-sm font-medium ${
                  n <= rating ? "bg-amber-400 border-amber-400 text-white" : "border-slate-300 text-slate-500"
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comments</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
            className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="How was the ride?" />
        </div>
        <button disabled={loading} className="w-full bg-brand-600 text-white rounded-md py-2.5 font-medium hover:bg-brand-700 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}
