import { useState, useRef } from "react";
import { Camera, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import StarRating from "../components/StarRating.jsx";
import { useToast } from "../components/Toast.jsx";

const fileToResizedDataUrl = (file, maxSize = 300, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please choose an image file", "error"); return; }
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAvatarPreview(dataUrl);
      setDirty(true);
    } catch { showToast("Could not process that image", "error"); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast("Name cannot be empty", "error"); return; }
    setSaving(true);
    try {
      await updateProfile({ name, phone, avatar: avatarPreview });
      showToast("Profile updated");
      setDirty(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update profile", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-primary dark:text-sky-300 mb-6">Your profile</h1>
      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex items-center gap-6">
          <div className="relative">
            <Avatar user={{ name, avatar: avatarPreview }} size={96} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-[#008fad] transition disabled:opacity-60">
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">{name || "Your name"}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-2"><StarRating value={user?.avgRating} count={user?.ratingCount} /></div>
            {uploading && <p className="text-xs text-accent mt-2">Processing photo...</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full name</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <input value={phone} onChange={(e) => { setPhone(e.target.value); setDirty(true); }}
              placeholder="+91 90000 00000"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input value={user?.email || ""} disabled
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-md px-3 py-2" />
          </div>
        </div>

        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4">
          <span className="text-xs text-slate-500">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
          <button type="submit" disabled={!dirty || saving}
            className="inline-flex items-center gap-2 bg-accent text-white rounded-md px-5 py-2 text-sm font-semibold hover:bg-[#008fad] disabled:opacity-50 disabled:cursor-not-allowed transition">
            {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs px-4 py-3 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div><strong>Tip:</strong> Upload a clear photo — passengers trust drivers with profile pictures more.</div>
        </div>
      </form>
    </div>
  );
}
