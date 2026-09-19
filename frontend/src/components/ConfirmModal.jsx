import { HelpCircle } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Yes, confirm", danger = false, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <HelpCircle className={`w-10 h-10 mx-auto mb-3 ${danger ? "text-rose-500" : "text-accent"}`} />
        <h3 className="text-lg font-bold text-primary mb-1.5">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="btn btn-outline !py-2 !px-4">Cancel</button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-accent hover:bg-[#008fad]"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
