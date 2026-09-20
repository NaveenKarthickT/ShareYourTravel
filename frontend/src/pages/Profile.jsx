import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Camera, Save, Star, CheckCircle2 } from "lucide-react";
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
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAvatarPreview(dataUrl);
      setDirty(true);
    } catch {
      showToast("Could not process that image", "error");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, phone, avatar: avatarPreview });
      showToast("Profile updated");
      setDirty(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-primary">Your profile</h1>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Avatar card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-6">
          <div className="relative">
            <Avatar user={{ name, avatar: avatarPreview }} size={96} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-[#008fad] transition disabled:opacity-60"
              title="Change photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800">{name || "Your name"}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-2">
              <StarRating value={user?.avgRating} count={user?.ratingCount} />
            </div>
            {uploading && <p className="text-xs text-accent mt-2">Processing photo...</p>}
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Details</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setDirty(true); }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setDirty(true); }}
              placeholder="+91 90000 00000"
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-slate-400 mt-1">Shown to passengers/drivers on your trips</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              value={user?.email || ""}
              disabled
              className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-md px-3 py-2"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-6 py-4">
          <span className="text-xs text-slate-500">
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </span>
          <button
            type="submit"
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 bg-accent text-white rounded-md px-5 py-2 text-sm font-semibold hover:bg-[#008fad] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-3 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Tip:</strong> Upload a clear photo — passengers trust drivers with profile pictures more.
          </div>
        </div>
      </form>
    </div>
  );
}