import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchIcon, Building2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function OrgSelect() {
  const { chooseOrg } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [orgsRes, memRes] = await Promise.all([
        api.get("/orgs", { params: search ? { search } : {} }),
        api.get("/orgs/mine"),
      ]);
      setOrgs(orgsRes.data.data);
      setMyMemberships(memRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const membershipFor = (orgId) => myMemberships.find((m) => m.organization?._id === orgId);

  const join = async (org) => {
    setMsg("");
    try {
      await api.post(`/orgs/${org._id}/join`);
      setMsg(`Request sent to join "${org.name}". Awaiting admin approval.`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send join request.");
    }
  };

  const enter = (m) => {
    chooseOrg(m.organization, m);
    navigate("/dashboard");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Choose your pooling community</h1>
      <p className="text-slate-600 mb-6">Join an existing community or start a brand new pooling server.</p>

      {myMemberships.filter((m) => m.status === "approved").length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3">Your communities</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {myMemberships.filter((m) => m.status === "approved").map((m) => (
              <button
                key={m._id}
                onClick={() => enter(m)}
                className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-400"
              >
                <div className="font-medium">{m.organization?.name}</div>
                <div className="text-xs text-slate-500 mt-1 capitalize">{m.role.replace("_", " ")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Search existing communities</h2>
        <Link to="/organizations/create" className="text-sm px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 flex items-center gap-1.5">
          <Building2 className="w-4 h-4" />
          Create new community
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by name or location, e.g. 'ABC Residency'"
            className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2"
          />
        </div>
        <button onClick={load} className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50">Search</button>
      </div>

      {msg && <div className="bg-brand-50 text-brand-700 text-sm px-3 py-2 rounded-md mb-4">{msg}</div>}

      {loading ? (
        <div className="text-slate-500">Loading communities...</div>
      ) : orgs.length === 0 ? (
        <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
          No pooling communities found. Be the first to create one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {orgs.map((org) => {
            const m = membershipFor(org._id);
            return (
              <div key={org._id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{org.name}</div>
                  {m && <StatusBadge status={m.status} />}
                </div>
                <div className="text-xs text-slate-500 mt-1 capitalize">{org.type?.replace("_", " ")} · {org.size}</div>
                {org.location && <div className="text-xs text-slate-400 mt-1">{org.location}</div>}
                <div className="mt-3">
                  {!m && (
                    <button onClick={() => join(org)} className="text-sm px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700">
                      Request to join
                    </button>
                  )}
                  {m?.status === "approved" && (
                    <button onClick={() => enter(m)} className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50">
                      Enter community
                    </button>
                  )}
                  {m?.status === "pending" && <span className="text-xs text-slate-400">Waiting for admin approval</span>}
                  {m?.status === "rejected" && <span className="text-xs text-rose-500">Your request was rejected</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
