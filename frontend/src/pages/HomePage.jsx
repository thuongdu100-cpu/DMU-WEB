import { BgGlow } from "../components/BgGlow.jsx";
import { SiteHeader } from "../components/SiteHeader.jsx";
import { SiteFooter } from "../components/SiteFooter.jsx";
import { NewsSection } from "../components/NewsSection.jsx";
import { usePageVisit } from "../hooks/usePageVisit.js";

export function HomePage() {
  usePageVisit();

  return (
    <>
      <BgGlow />
      <SiteHeader />
      <main>
        <section id="trang-chu" className="hero">
          <div className="container hero-inner">
            <div className="hero-grid">
              <div className="hero-content">
                <p className="hero-badge">Nguồn tin công nghệ hiện đại dành cho kỷ nguyên AI</p>
                <h1 className="hero-title">
                  Khám phá thế giới <span className="hero-title-gradient">công nghệ &amp; AI</span> mỗi ngày
                </h1>
                <p className="hero-desc">
                  Trang tin chuyên cập nhật xu hướng trí tuệ nhân tạo, chuyển đổi số, dữ liệu lớn và các đổi mới của
                  công nghệ 4.0. Giao diện hiện đại, sắc nét và đậm cảm hứng tương lai.
                </p>
                <div className="hero-cta">
                  <a href="#tin-tuc" className="btn btn-primary">
                    Đọc tin mới
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                  <a href="#gioi-thieu" className="btn btn-secondary">
                    Tìm hiểu thêm
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="gioi-thieu" className="section intro intro-showcase" aria-labelledby="intro-heading">
          <div className="container intro-showcase-inner">
            <header className="intro-header">
              <p className="section-label">GIỚI THIỆU</p>
              <h2 id="intro-heading" className="section-heading intro-heading intro-heading--centered">
                Phòng Ban <span className="intro-heading-accent">DMU</span>
              </h2>
              <p className="intro-text intro-text--centered">
                Phòng DMU (Deep Medicine Unit) là đơn vị nghiên cứu và ứng dụng trí tuệ nhân tạo thuộc Trường Đại Học
                Phan Châu Trinh, chịu trách nhiệm phát triển các giải pháp AI phục vụ đào tạo, nghiên cứu y khoa và
                chuyển đổi số.
              </p>
            </header>
            <div className="feature-cards feature-cards--intro">
              <article className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="feature-title">Nghiên cứu AI</h3>
                <p className="feature-text">Nghiên cứu và phát triển các mô hình trí tuệ nhân tạo ứng dụng trong y tế và giáo dục.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="feature-title">An toàn dữ liệu</h3>
                <p className="feature-text">Đảm bảo an toàn thông tin và dữ liệu nghiên cứu theo tiêu chuẩn quốc tế.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="feature-title">Ứng dụng thực tiễn</h3>
                <p className="feature-text">Chuyển giao công nghệ AI vào thực tiễn đào tạo và khám chữa bệnh.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="feature-title">Đội ngũ học thuật</h3>
                <p className="feature-text">Tập hợp giảng viên, nghiên cứu sinh và chuyên gia AI giàu kinh nghiệm.</p>
              </article>
            </div>
          </div>
        </section>

        <NewsSection />

        <SiteFooter />
      </main>
    </>
  );
}
