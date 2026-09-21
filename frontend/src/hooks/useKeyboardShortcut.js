import { useEffect } from "react";

export default function useKeyboardShortcut(key, callback, options = {}) {
  const { meta = false, ctrl = false, shift = false, alt = false } = options;

  useEffect(() => {
    const handler = (e) => {
      const wantsMeta = meta ? e.metaKey || e.ctrlKey : true;
      const wantsCtrl = ctrl ? e.ctrlKey : true;
      const wantsShift = shift ? e.shiftKey : true;
      const wantsAlt = alt ? e.altKey : true;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        wantsMeta && wantsCtrl && wantsShift && wantsAlt
      ) {
        e.preventDefault();
        callback(e);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [key, callback, meta, ctrl, shift, alt]);
}
