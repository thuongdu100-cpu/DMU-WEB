import { useCallback, useEffect, useState } from "react";
import { readResponseJson } from "../api/client.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meRole, setMeRole] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newRole, setNewRole] = useState("contributor");
  const [busy, setBusy] = useState(false);

  const loadMe = useCallback(async () => {
    const r = await fetch("/api/admin/auth/me", { credentials: "include" });
    const d = await readResponseJson(r);
    if (r.ok && d.admin) setMeRole(d.role || null);
    else setMeRole(null);
  }, []);

  const load = useCallback(async () => {
    setErr("");
    const r = await fetch("/api/admin/users", { credentials: "include" });
    const d = await readResponseJson(r);
    if (!r.ok) throw new Error(d.message || "Không tải được danh sách.");
    setUsers(Array.isArray(d.users) ? d.users : []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadMe();
        await load();
      } catch (e) {
        setErr(e.message || "Lỗi");
      }
    })();
  }, [load, loadMe]);

  const isAdmin = meRole === "admin";

  function canDeleteUser(u) {
    if (u.role === "admin") return false;
    if (!isAdmin) return false;
    return true;
  }

  async function onCreate(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (password !== passwordConfirm) {
      setErr("Mật khẩu xác nhận không khớp.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password, role: newRole })
      });
      const d = await readResponseJson(r);
      if (!r.ok) throw new Error(d.message || "Tạo thất bại.");
      setMsg(`Đã tạo tài khoản (${newRole}).`);
      setUsername("");
      setPassword("");
      setPasswordConfirm("");
      setPasswordVisible(false);
      await load();
    } catch (ex) {
      setErr(ex.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id, name) {
    if (!window.confirm(`Xoá tài khoản "${name}"?`)) return;
    setErr("");
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      const d = await readResponseJson(r);
      if (!r.ok) throw new Error(d.message || "Xoá thất bại.");
      setMsg("Đã xoá tài khoản.");
      await load();
    } catch (ex) {
      setErr(ex.message || "Lỗi");
    }
  }

  return (
    <>
      <h1 className="admin-h1">Tài khoản</h1>
      <p className="admin-lead">
        <strong>Admin</strong> (quản trị viên): tạo / xoá tài khoản <strong>editor</strong> (người duyệt bài) và{" "}
        <strong>contributor</strong> (người viết bài). Contributor gửi bài ở trạng thái chờ duyệt; editor hoặc admin mới
        xuất bản công khai.
      </p>

      {msg ? <div className="admin-msg ok">{msg}</div> : null}
      {err ? <div className="admin-msg error">{err}</div> : null}

      {isAdmin ? (
        <div className="admin-card">
          <h2>Tạo tài khoản</h2>
          <form className="admin-form" onSubmit={onCreate}>
            <label htmlFor="div-new-username">Tên đăng nhập</label>
            <input
              id="div-new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
            />
            <label htmlFor="div-new-password">Mật khẩu (tối thiểu 8 ký tự)</label>
            <div className="admin-password-with-toggle">
              <input
                id="div-new-password"
                type={passwordVisible ? "text" : "password"}
                className="admin-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                className="admin-password-toggle"
                aria-pressed={passwordVisible}
                aria-label={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setPasswordVisible((v) => !v)}
              >
                {passwordVisible ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12c2.2-3.8 5.6-6 10-6s7.8 2.2 10 6c-2.2 3.8-5.6 6-10 6s-7.8-2.2-10-6z" />
                    <line x1="4" y1="4" x2="20" y2="20" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12c2.2-3.8 5.6-6 10-6s7.8 2.2 10 6c-2.2 3.8-5.6 6-10 6s-7.8-2.2-10-6z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <label htmlFor="div-new-password-confirm">Xác nhận mật khẩu</label>
            <div className="admin-password-with-toggle">
              <input
                id="div-new-password-confirm"
                type={passwordVisible ? "text" : "password"}
                className="admin-password-input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <label htmlFor="div-new-role">Vai trò</label>
            <select
              id="div-new-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                maxWidth: "100%",
                padding: "0.7rem 0.95rem",
                borderRadius: "10px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-panel)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                fontSize: "0.9375rem"
              }}
            >
              <option value="contributor">contributor — viết bài (chờ duyệt khi gửi)</option>
              <option value="editor">editor — duyệt bài, xuất bản</option>
            </select>
            <div className="admin-actions btn-row">
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Đang tạo…" : "Tạo tài khoản"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-card">
        <h2>Danh sách</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    {canDeleteUser(u) ? (
                      <div className="admin-actions">
                        <button type="button" className="danger" onClick={() => onDelete(u.id, u.username)}>
                          Xoá
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-body)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
