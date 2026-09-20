import { Link } from "react-router-dom";
import { Home, Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-[6rem] font-black leading-none text-accent/20 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-primary mt-2">Page not found</h1>
        <p className="text-slate-500 mt-2 text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link to="/" className="btn btn-primary">
            <Home className="w-4 h-4" /> Go home
          </Link>
          <Link to="/organizations" className="btn btn-outline">
            <Compass className="w-4 h-4" /> Browse communities
          </Link>
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Back to previous page
        </button>
      </div>
    </div>
  );
}