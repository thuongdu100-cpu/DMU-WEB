import { useCallback, useEffect, useState } from "react";
import { readResponseJson } from "../api/client.js";

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meRole, setMeRole] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("editor");
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

  const isOwner = meRole === "owner";
  const isModerator = meRole === "moderator";

  function canDeleteUser(u) {
    if (u.username === "ai-bot") return false;
    if (u.role === "owner") return false;
    if (isModerator) return u.role === "editor";
    if (isOwner) return true;
    return false;
  }

  async function onCreate(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const role = isOwner ? newRole : "editor";
      const r = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password, role })
      });
      const d = await readResponseJson(r);
      if (!r.ok) throw new Error(d.message || "Tạo thất bại.");
      setMsg(isOwner ? `Đã tạo tài khoản (${role}).` : "Đã tạo tài khoản editor.");
      setUsername("");
      setPassword("");
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
      <h1 className="admin-h1">Tài khoản &amp; duyệt bài</h1>
      <p className="admin-lead">
        <strong>Owner</strong> (admin chính): tạo moderator, editor, bot AI. <strong>Moderator</strong>: chỉ quản tài khoản{" "}
        <strong>editor</strong>, xem và <strong>xuất bản / duyệt</strong> mọi bài. <strong>Editor</strong>: chỉ lưu{" "}
        <strong>bản nháp</strong> (không tự publish). AI vẫn dùng Bearer + <code>ai-bot</code>.
      </p>

      {msg ? <div className="admin-msg ok">{msg}</div> : null}
      {err ? <div className="admin-msg error">{err}</div> : null}

      <div className="admin-card">
        <h2>{isModerator ? "Tạo tài khoản editor (đăng bài)" : "Tạo tài khoản"}</h2>
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
          <input
            id="div-new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
          {isOwner ? (
            <>
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
                <option value="editor">editor — chỉ đăng bài nháp</option>
                <option value="moderator">moderator — duyệt bài + quản editor</option>
                <option value="bot">bot — chỉ API AI (không đăng nhập web)</option>
              </select>
            </>
          ) : null}
          <div className="admin-actions btn-row">
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Đang tạo…" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>Danh sách{isModerator ? " (chỉ editor)" : ""}</h2>
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
