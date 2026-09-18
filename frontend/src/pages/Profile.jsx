import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";

// Resizes/compresses an image file client-side before it's sent to the
// backend as a base64 data URI — keeps the payload small since there's no
// external file storage (S3/Cloudinary) wired up yet.
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
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAvatarPreview(dataUrl);
    } catch {
      setError("Could not process that image. Try a different photo.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) return setError("Name cannot be empty.");
    try {
      setLoading(true);
      await updateProfile({ name, phone, avatar: avatarPreview });
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Your profile</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-md">{success}</div>}

        <div className="flex flex-col items-center gap-3">
          <Avatar user={{ name, avatar: avatarPreview }} size={88} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            {uploading ? "Processing..." : "Change photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-md px-3 py-2"
          />
          <p className="text-xs text-slate-400 mt-1">Email can't be changed here.</p>
        </div>

        <button
          disabled={loading}
          className="w-full bg-brand-600 text-white rounded-md py-2.5 font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
