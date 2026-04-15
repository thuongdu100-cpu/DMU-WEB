import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BgGlow } from "../components/BgGlow.jsx";
import { AdminNav } from "./AdminNav.jsx";
import "../styles/admin.css";

export function AdminShell() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await fetch("/api/admin/auth/me", { credentials: "include" }).then((r) => r.json());
        if (!d.admin) {
          navigate("/admin/login", { replace: true });
          return;
        }
      } catch {
        navigate("/admin/login", { replace: true });
        return;
      }
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
    return (
      <>
        <BgGlow />
        <div className="admin-wrap">
          <p className="admin-lead">Đang xác thực phiên…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <BgGlow />
      <div className="admin-wrap">
        <AdminNav />
        <Outlet />
      </div>
    </>
  );
}
