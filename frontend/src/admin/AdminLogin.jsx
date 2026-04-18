import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BgGlow } from "../components/BgGlow.jsx";
import "../styles/admin.css";
import { readResponseJson } from "../api/client.js";

export function AdminLogin() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    const fd = new FormData(e.target);
    const username = (fd.get("username") || "").toString().trim();
    const password = (fd.get("password") || "").toString();
    try {
      const r = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });
      const d = await readResponseJson(r);
      if (!r.ok) throw new Error(d.message || "\u0110\u0103ng nh\u1EADp th\u1EA5t b\u1EA1i");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setMsg(err.message || "Lỗi");
    }
  }

  return (
    <>
      <BgGlow />
      <div className="admin-wrap" style={{ maxWidth: 420, paddingTop: "3rem" }}>
        <h1 className="admin-h1">Đăng nhập DMU NEWS</h1>
        {msg ? <div className="admin-msg error">{msg}</div> : null}
        <form className="admin-form admin-card" onSubmit={onSubmit}>
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            autoCapitalize="none"
            spellCheck={false}
          />

          <label htmlFor="password">Mật khẩu</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Đăng nhập
            </button>
          </div>
        </form>
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/">← Về trang chủ</Link>
        </p>
      </div>
    </>
  );
}
