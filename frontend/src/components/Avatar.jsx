// Circular avatar: shows the uploaded photo if present, otherwise the
// user's initials on a brand-colored background.
export default function Avatar({ user, size = 36, className = "" }) {
  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={style}
        className={`rounded-full object-cover border border-slate-200 ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold ${className}`}
    >
      {initials}
    </div>
  );
}
