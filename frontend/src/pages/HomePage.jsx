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
    fetch(`${import.meta.env.VITE_API_TARGET}/api/media/intro`)
      .then(res => res.json())
      .then(data => {
        if (data?.url) {
          setVideoUrl(`${import.meta.env.VITE_API_TARGET}${data.url}`);
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

            <div className="feature-cards feature-cards--intro">
              <article className="feature-card">
                <h3>Nghiên cứu AI</h3>
                <p>Nghiên cứu và phát triển các mô hình AI.</p>
              </article>

              <article className="feature-card">
                <h3>An toàn dữ liệu</h3>
                <p>Đảm bảo an toàn thông tin nghiên cứu.</p>
              </article>

              <article className="feature-card">
                <h3>Ứng dụng thực tiễn</h3>
                <p>Chuyển giao công nghệ AI vào thực tế.</p>
              </article>

              <article className="feature-card">
                <h3>Đội ngũ học thuật</h3>
                <p>Giảng viên và chuyên gia AI giàu kinh nghiệm.</p>
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