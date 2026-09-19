import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Layers, Users2, MapPin, FileText, PlusCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CreateOrg() {
  const navigate = useNavigate();
  const { chooseOrg } = useAuth();
  const [form, setForm] = useState({ name: "", type: "residency", size: "medium", description: "", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Community name is required.");
    try {
      setLoading(true);
      const { data } = await api.post("/orgs", form);
      chooseOrg(data.data, { role: "org_admin", status: "approved" });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create organization.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2 text-primary">Create a new pooling community</h1>
      <p className="text-slate-600 mb-6">
        This creates an independent pooling server with its own users, admin and trips. You'll become its admin.
      </p>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Organization / community name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. Green Ride Co" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Type</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="residency">Residency</option>
                <option value="it_park">IT Park</option>
                <option value="corporate">Corporate</option>
                <option value="college">College</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Community size</label>
            <div className="relative">
              <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="small">Small (&lt;50)</option>
                <option value="medium">Medium (50-500)</option>
                <option value="large">Large (500-2000)</option>
                <option value="enterprise">Enterprise (2000+)</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="City / area" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3} />
          </div>
        </div>
        <button disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
          <PlusCircle className="w-4 h-4" />
          {loading ? "Creating..." : "Create pooling community"}
        </button>
      </form>
    </div>
  );
}
