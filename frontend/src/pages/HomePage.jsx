import { BgGlow } from "../components/BgGlow.jsx";
import { SiteHeader } from "../components/SiteHeader.jsx";
import { SiteFooter } from "../components/SiteFooter.jsx";
import { NewsSection } from "../components/NewsSection.jsx";
import { usePageVisit } from "../hooks/usePageVisit.js";
import { useEffect, useState } from "react";

export function HomePage() {
  usePageVisit();

  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    fetch("/api/media/intro")
      .then(res => res.json())
      .then(data => {
        if (data?.url) {
          setVideoUrl(String(data.url));
        }
      })
      .catch(err => {
        console.log("Video load error:", err);
      });
  }, []);

  return (
    <>
      <BgGlow />
      <SiteHeader />

      <main>
        <section id="trang-chu" className="hero">
          <div className="container hero-inner">
            <div className="hero-grid">

              {/* TEXT */}
              <div className="hero-content">
                <p className="hero-badge">
                  Nguồn tin công nghệ hiện đại dành cho kỷ nguyên AI
                </p>

                <h1 className="hero-title">
                  Khám phá thế giới <span className="hero-title-gradient">công nghệ & AI</span> mỗi ngày
                </h1>

                <p className="hero-desc">
                  Trang tin chuyên cập nhật xu hướng trí tuệ nhân tạo...
                </p>

                <div className="hero-cta">
                  <a href="#tin-tuc" className="btn btn-primary">Đọc tin mới</a>
                  <a href="#gioi-thieu" className="btn btn-secondary">Tìm hiểu thêm</a>
                </div>
              </div>

              {/* VIDEO */}
              <div className="hero-visual">
                {videoUrl ? (
                  <video
                    className="hero-video"
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="hero-video-placeholder">
                    Loading video...
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* INTRO */}
        <section id="gioi-thieu" className="section intro intro-showcase">
          <div className="container intro-showcase-inner">
            <header className="intro-header">
              <p className="section-label">GIỚI THIỆU</p>

              <h2 className="section-heading intro-heading--centered">
                Phòng Ban <span className="intro-heading-accent">DMU</span>
              </h2>

              <p className="intro-text intro-text--centered">
                Phòng DMU (Deep Medicine Unit) là đơn vị nghiên cứu và ứng dụng trí tuệ nhân tạo...
              </p>
            </header>

            <div className="intro-feature-cards-wrap">
              <div className="feature-cards feature-cards--intro">
                <article className="feature-card">
                  <div className="feature-card-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Nghiên cứu AI</h3>
                  <p className="feature-text">
                    Nghiên cứu và phát triển các mô hình trí tuệ nhân tạo ứng dụng trong y tế và giáo dục.
                  </p>
                </article>

                <article className="feature-card">
                  <div className="feature-card-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                      <path d="M15 13h.01M9 13h.01" />
                      <path d="M12 18v-2M8 2v2M16 2v2" opacity="0.85" />
                    </svg>
                  </div>
                  <h3 className="feature-title">An toàn dữ liệu</h3>
                  <p className="feature-text">
                    Đảm bảo an toàn thông tin và dữ liệu nghiên cứu theo tiêu chuẩn quốc tế.
                  </p>
                </article>

                <article className="feature-card">
                  <div className="feature-card-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Ứng dụng thực tiễn</h3>
                  <p className="feature-text">
                    Chuyển giao công nghệ AI vào thực tiễn đào tạo và khám chữa bệnh.
                  </p>
                </article>

                <article className="feature-card">
                  <div className="feature-card-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Đội ngũ học thuật</h3>
                  <p className="feature-text">
                    Tập hợp giảng viên, nghiên cứu sinh và chuyên gia AI giàu kinh nghiệm.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <NewsSection />
        <SiteFooter />
      </main>
    </>
  );
}