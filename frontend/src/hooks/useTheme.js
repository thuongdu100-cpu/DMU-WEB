import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dmu-news-theme";

export function useTheme() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      const t = s === "light" || s === "dark" ? s : "dark";
      document.documentElement.setAttribute("data-theme", t);
      setTheme(t);
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
