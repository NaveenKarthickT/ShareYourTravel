import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [otherParty, setOtherParty] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/messages/${bookingId}`);
      setMessages(data.data.messages);
      setOtherParty(data.data.otherParty);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this chat.");
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 3000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line
  }, [bookingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const draft = text;
    setText("");
    try {
      await api.post("/messages", { bookingId, text: draft });
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send message.");
      setText(draft);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-3 self-start">← Back</button>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
          Chat {otherParty?.name ? `with ${otherParty.name}` : ""}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-950" style={{ minHeight: 320 }}>
          {loading ? (
            <div className="text-slate-500 text-sm">Loading conversation...</div>
          ) : error ? (
            <div className="text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-md">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-400 text-sm text-center mt-8">No messages yet. Say hello!</div>
          ) : (
            messages.map((m) => {
              const mine = String(m.sender?._id) === String(user?.id);
              return (
                <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${mine ? "bg-accent text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"}`}>
                    {!mine && <div className="text-xs font-medium text-slate-400 mb-0.5">{m.sender?.name}</div>}
                    {m.text}
                    <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-slate-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..."
            className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button type="submit" disabled={!text.trim()}
            className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad] disabled:opacity-50">Send</button>
        </form>
      </div>
    </div>
  );
}
