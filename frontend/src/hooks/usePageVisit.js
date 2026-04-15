import { useEffect } from "react";

export function usePageVisit() {
  useEffect(() => {
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ path: window.location.pathname })
    }).catch(() => {});
  }, []);
}
