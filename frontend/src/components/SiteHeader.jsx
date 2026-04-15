import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle.jsx";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to={{ pathname: "/", hash: "trang-chu" }} className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-title">DMU NEWS</span>
            <span className="brand-sub">Công nghệ • AI • 4.0</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Điều hướng chính">
          <Link to={{ pathname: "/", hash: "trang-chu" }}>Trang chủ</Link>
          <Link to={{ pathname: "/", hash: "gioi-thieu" }}>Giới thiệu</Link>
          <Link to={{ pathname: "/", hash: "tin-tuc" }}>Tin tức</Link>
          <Link to={{ pathname: "/", hash: "lien-he" }}>Liên hệ</Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <Link to="/admin/login" className="btn-login">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            ĐĂNG NHẬP
          </Link>
        </div>
      </div>
    </header>
  );
}
