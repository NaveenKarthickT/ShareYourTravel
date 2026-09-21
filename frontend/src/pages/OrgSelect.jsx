import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Building2, PlusCircle, Users } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../components/Toast.jsx";

export default function OrgSelect() {
  const { chooseOrg } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
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
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const membershipFor = (orgId) => myMemberships.find((m) => m.organization?._id === orgId);

  const join = async (org) => {
    setMsg("");
    try {
      await api.post(`/orgs/${org._id}/join`);
      setMsg(`Request sent to join "${org.name}". Awaiting admin approval.`);
      showToast(`Request sent to ${org.name}`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send join request.");
    }
  };

  const enter = (m) => { chooseOrg(m.organization, m); navigate("/dashboard"); };

  const approved = myMemberships.filter((m) => m.status === "approved");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2 text-primary dark:text-sky-300">Choose your pooling community</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Join an existing community or start a brand new pooling server.</p>

      {approved.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3 text-slate-700 dark:text-slate-300">Your communities</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {approved.map((m) => (
              <button key={m._id} onClick={() => enter(m)}
                className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-accent hover:shadow-sm transition">
                <div className="font-medium text-slate-800 dark:text-slate-200">{m.organization?.name}</div>
                <div className="text-xs text-slate-500 mt-1 capitalize">{m.role.replace("_", " ")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700 dark:text-slate-300">Search existing communities</h2>
        <Link to="/organizations/create"
          className="text-sm px-4 py-2 rounded-md bg-accent text-white font-medium hover:bg-[#008fad] flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Create new community
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by name or location"
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <button onClick={load} className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Search</button>
      </div>

      {msg && <div className="bg-accent-soft text-primary text-sm px-3 py-2 rounded-md mb-4">{msg}</div>}

      {loading ? (
        <div className="text-slate-500">Loading communities...</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No communities found</h3>
          <p className="text-slate-500 text-sm mb-5">Be the first to create one for your workplace.</p>
          <Link to="/organizations/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad]">
            <PlusCircle className="w-4 h-4" /> Create community
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {orgs.map((org) => {
            const m = membershipFor(org._id);
            return (
              <div key={org._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{org.name}</div>
                  {m && <StatusBadge status={m.status} />}
                </div>
                <div className="text-xs text-slate-500 mt-1 capitalize">{org.type?.replace("_", " ")} · {org.size}</div>
                {org.location && <div className="text-xs text-slate-400 mt-1">{org.location}</div>}
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{org.memberCount || 0} members</span>
                </div>
                <div className="mt-3">
                  {!m && (
                    <button onClick={() => join(org)}
                      className="text-sm px-3 py-1.5 rounded-md bg-accent text-white hover:bg-[#008fad]">Request to join</button>
                  )}
                  {m?.status === "approved" && (
                    <button onClick={() => enter(m)}
                      className="text-sm px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Enter community</button>
                  )}
                  {m?.status === "pending" && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">⏳ Waiting for admin approval</span>}
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
