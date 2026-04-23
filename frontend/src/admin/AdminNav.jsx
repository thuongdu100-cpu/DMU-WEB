import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readResponseJson } from "../api/client.js";

export function AdminNav() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/auth/me", { credentials: "include" });
        const d = await readResponseJson(r);
        if (!cancelled && d.admin) setRole(d.role || null);
      } catch {
        if (!cancelled) setRole(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout(e) {
    e.preventDefault();
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
    navigate("/admin/login");
  }

  return (
    <nav className="admin-nav">
      <strong style={{ color: "var(--text-primary)" }}>Admin</strong>
      <Link to="/admin/dashboard">Dashboard</Link>
      <Link to="/admin/article/new">Đăng bài</Link>
      <Link to="/admin/articles">Quản lý bài viết</Link>
      {role === "owner" || role === "moderator" ? <Link to="/admin/users">Tài khoản</Link> : null}
      <span className="spacer" />
      <a href="#logout" onClick={logout}>
        Đăng xuất
      </a>
      <Link to="/">Trang chủ</Link>
    </nav>
  );
}
