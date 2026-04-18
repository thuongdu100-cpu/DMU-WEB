import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <section id="lien-he" className="section footer-section">
      <div className="container">
        <div className="footer-panel footer-panel--design">
          <div className="footer-columns footer-columns--design">
            <div className="footer-col footer-col--brand">
              <p className="footer-brand-title">
                DMU<span className="footer-brand-dot">.</span>
              </p>
              <p className="footer-brand-desc">
                Phòng DMU – Kiến tạo trí tuệ nhân tạo cho viện – trường Đại Học Phan Châu Trinh.
              </p>
            </div>

            <div className="footer-col">
              <p className="footer-col-heading">Liên kết nhanh</p>
              <ul className="footer-links footer-links--design">
                <li>
                  <Link to={{ pathname: "/", hash: "trang-chu" }}>Trang chủ</Link>
                </li>
                <li>
                  <Link to={{ pathname: "/", hash: "gioi-thieu" }}>Giới thiệu</Link>
                </li>
                <li>
                  <Link to={{ pathname: "/", hash: "tin-tuc" }}>Tin tức</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col footer-col--contact">
              <p className="footer-col-heading">Liên hệ</p>
              <ul className="footer-list footer-list--design">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                  <a href="mailto:deepmed@pctu.edu.vn">deepmed@pctu.edu.vn</a>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                  </svg>
                  <span>Phòng DMU</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>09 Nguyễn Gia Thiều, P. Điện Bàn Đông, TP. Đà Nẵng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="copyright-bar copyright-bar--design">
          <p>© 2026 Trường Đại Học Phan Châu Trinh. Phòng DMU. All rights reserved.</p>
        </div>
      </div>
    </section>
  );
}
