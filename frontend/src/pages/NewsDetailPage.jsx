import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BgGlow } from "../components/BgGlow.jsx";
import { SiteHeader } from "../components/SiteHeader.jsx";
import { SiteFooter } from "../components/SiteFooter.jsx";
import { usePageVisit } from "../hooks/usePageVisit.js";
import { readResponseJson } from "../api/client.js";
import { mediaDisplayList } from "../utils/articleMedia.js";
import { ArticleBodyFromLayout } from "../components/ArticleBodyFromLayout.jsx";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

export function NewsDetailPage() {
  usePageVisit();
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, err: "", article: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, err: "" }));
      try {
        const r = await fetch("/api/public/articles/" + encodeURIComponent(id), { credentials: "include" });
        const d = await readResponseJson(r);
        if (!r.ok) throw new Error(d.message || "Không tải được bài.");
        if (cancelled) return;
        setState({ loading: false, err: "", article: d.article });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, err: e.message || "Lỗi", article: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const article = state.article;
  const hasLayout = article && Array.isArray(article.contentLayout) && article.contentLayout.length > 0;
  const mediaItems = article && !hasLayout ? mediaDisplayList(article) : [];

  return (
    <>
      <BgGlow />
      <SiteHeader />
      <main className="article-page">
        <div className="container article-page-inner">
          {state.loading ? (
            <p className="article-status">Đang tải…</p>
          ) : state.err ? (
            <p className="article-status article-status--error">{state.err}</p>
          ) : state.article ? (
            <>
              <nav className="article-breadcrumb" aria-label="Điều hướng">
                <Link to={{ pathname: "/", hash: "trang-chu" }}>Trang chủ</Link>
                <span aria-hidden="true"> / </span>
                <Link to={{ pathname: "/", hash: "tin-tuc" }}>Tin tức</Link>
                <span aria-hidden="true"> / </span>
                <span className="article-breadcrumb-current">{state.article.title}</span>
              </nav>

              <header className="article-header">
                <p className="article-meta-line">
                  <span className="news-date">{formatDate(state.article.updatedAt || state.article.createdAt)}</span>
                </p>
                <h1 className="article-title">{state.article.title}</h1>
              </header>

              {hasLayout ? (
                <ArticleBodyFromLayout contentLayout={state.article.contentLayout} />
              ) : (
                <>
                  {mediaItems.length > 0 ? (
                    <div className="article-gallery article-gallery--media">
                      {mediaItems.map((m, idx) =>
                        m.type === "video" ? (
                          <video
                            key={m.url + idx}
                            className="article-video article-gallery__media"
                            src={m.url}
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            key={m.url + idx}
                            className="article-gallery__img"
                            src={m.url}
                            alt=""
                            loading="lazy"
                          />
                        )
                      )}
                    </div>
                  ) : null}
                  <div className="article-body">{state.article.content}</div>
                </>
              )}
            </>
          ) : null}
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
