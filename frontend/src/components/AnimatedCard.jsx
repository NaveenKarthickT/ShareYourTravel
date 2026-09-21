import { useEffect, useRef, useState } from "react";

export default function AnimatedCard({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={
        "transition-all duration-500 ease-out " +
        (visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2") +
        " " +
        className
      }
    >
      {children}
    </div>
  );
}
