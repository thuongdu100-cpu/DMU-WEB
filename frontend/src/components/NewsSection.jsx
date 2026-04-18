import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readResponseJson } from "../api/client.js";

/** Mỗi lần chỉ hiển thị 3 tin (một hàng); mũi tên chuyển nhóm tiếp theo */
const NEWS_PAGE_SIZE = 3;

function IconChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

export function NewsSection() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / NEWS_PAGE_SIZE)),
    [items.length]
  );

  const visibleItems = useMemo(() => {
    const start = (page - 1) * NEWS_PAGE_SIZE;
    return items.slice(start, start + NEWS_PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  function goPage(next) {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    document.getElementById("tin-tuc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/public/articles");
        const d = await readResponseJson(r);
        if (!r.ok) throw new Error(d.message || "Lỗi tải tin");
        if (!cancelled) setItems(Array.isArray(d.articles) ? d.articles : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Không tải được tin tức.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="tin-tuc" className="section news-section">
      <div className="container">
        <div className="news-section-head">
          <div>
            <p className="section-label">TIN TỨC</p>
            <h2 className="section-heading news-heading">Bài viết từ ban biên tập</h2>
          </div>
          <p className="news-filter-pill">Công nghệ • AI • Chuyển đổi số</p>
        </div>

        {err ? <p className="news-fetch-error">{err}</p> : null}

        {!err && items.length === 0 ? (
          <p className="news-empty">Chưa có bài đăng. Hãy thêm tin trong khu vực quản trị.</p>
        ) : null}

        {!err && items.length > 0 ? (
          <div
            className={items.length > NEWS_PAGE_SIZE ? "news-row-block news-row-block--paged" : "news-row-block"}
          >
            {items.length > NEWS_PAGE_SIZE ? (
              <button
                type="button"
                className="news-arrow news-arrow--prev"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
                aria-label="Xem ba tin trước"
              >
                <IconChevronLeft />
              </button>
            ) : null}
            <div className="news-grid-wrap">
              <div className="news-grid news-grid--strip">
                {visibleItems.map((a) => (
                  <article key={a.id} className="news-card">
                    {a.thumbnail ? (
                      <Link to={"/news/" + encodeURIComponent(a.id)} className="news-card-thumb-link">
                        <img className="news-card-thumb" src={a.thumbnail} alt="" loading="lazy" />
                      </Link>
                    ) : null}
                    <div className="news-card-meta">
                      <span className="news-cat">TIN DMU</span>
                      <span className="news-date">{formatDate(a.updatedAt || a.createdAt)}</span>
                    </div>
                    <h3 className="news-title">
                      <Link to={"/news/" + encodeURIComponent(a.id)}>{a.title}</Link>
                    </h3>
                    <p className="news-summary">{a.excerpt}</p>
                    <Link to={"/news/" + encodeURIComponent(a.id)} className="news-link">
                      Đọc bài →
                    </Link>
                  </article>
                ))}
              </div>
            </div>
            {items.length > NEWS_PAGE_SIZE ? (
              <button
                type="button"
                className="news-arrow news-arrow--next"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
                aria-label="Xem ba tin tiếp theo"
              >
                <IconChevronRight />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
