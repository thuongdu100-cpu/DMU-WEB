import { Link, useNavigate } from "react-router-dom";

export function AdminNav() {
  const navigate = useNavigate();

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
      <span className="spacer" />
      <a href="#logout" onClick={logout}>
        Đăng xuất
      </a>
      <Link to="/">Trang chủ</Link>
    </nav>
  );
}
