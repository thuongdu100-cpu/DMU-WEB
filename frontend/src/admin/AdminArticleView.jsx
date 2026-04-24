import { Component, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, readResponseJson } from "../api/client.js";
import { mediaDisplayList } from "../utils/articleMedia.js";
import { ArticleBodyFromLayout } from "../components/ArticleBodyFromLayout.jsx";

class ArticlePreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="admin-msg error">Không thể hiển thị nội dung bài viết. Vui lòng tải lại trang.</div>;
    }
    return this.props.children;
  }
}

export function AdminArticleView() {
  const { id } = useParams();
  const [art, setArt] = useState(null);
  const [err, setErr] = useState("");
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/admin/auth/me", { credentials: "include" });
        const d = await readResponseJson(r);
        if (!cancelled && r.ok && d.admin) {
          setMyRole(d.role || null);
        }
      } catch {
        if (!cancelled) setMyRole(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const d = await api("/api/admin/articles/" + encodeURIComponent(id));
        setArt(d.article);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  if (err) return <div className="admin-msg error">{err}</div>;
  if (!art) return <p className="admin-lead">Đang tải…</p>;

  const hasLayout = Array.isArray(art?.contentLayout) && art.contentLayout.length > 0;
  const legacyMedia = !hasLayout ? mediaDisplayList(art) : [];
  const isDraft = art?.status === "draft";
  const st = art?.status || "draft";
  const canModerate = myRole === "admin" || myRole === "editor";
  const canEdit = myRole === "admin" || myRole === "editor" || myRole === "contributor" || myRole == null;
  const editLabel = st === "pending" && canModerate ? "Duyệt bài" : "Sửa";

  return (
    <div className="admin-card">
      {st === "draft" ? (
        <div className="admin-msg draft-banner" role="status">
          <strong>Bản nháp</strong> — chỉ xem trong admin. Trang tin công khai chưa hiển thị bài này.
        </div>
      ) : null}
      {st === "pending" ? (
        <div className="admin-msg draft-banner" role="status">
          <strong>Chờ duyệt</strong> — bài chưa xuất bản công khai. Editor hoặc admin có thể xuất bản hoặc từ chối trong
          mục Sửa bài.
        </div>
      ) : null}
      {st === "rejected" ? (
        <div className="admin-msg error" role="status">
          <strong>Đã từ chối</strong> — bài không được xuất bản công khai.
        </div>
      ) : null}
      <h1 className="admin-h1" style={{ fontSize: "1.35rem" }}>
        {art.title}
      </h1>
      <p className="admin-lead" style={{ fontSize: "0.8rem" }}>
        Tạo: {(art.createdAt || "").replace("T", " ").slice(0, 19)}
        {" · "}
        <span
          className={
            "admin-status-pill " +
            (st === "published"
              ? "admin-status-pill--live"
              : st === "pending"
                ? "admin-status-pill--pending"
                : st === "rejected"
                  ? "admin-status-pill--rejected"
                  : "admin-status-pill--draft")
          }
        >
          {st === "published" ? "Đã đăng" : st === "pending" ? "Chờ duyệt" : st === "rejected" ? "Từ chối" : "Nháp"}
        </span>
      </p>
      {art.excerpt ? (
        <p className="admin-lead" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
          <strong>Tóm tắt:</strong> {art.excerpt}
        </p>
      ) : null}
      <div className="admin-actions" style={{ marginBottom: "1rem" }}>
        {canEdit ? (
          <Link className="btn-admin primary" to={"/admin/article/" + id + "/edit"}>
            {editLabel}
          </Link>
        ) : null}
        {st === "published" ? (
          <Link className="btn-admin" to={"/news/" + id} target="_blank" rel="noopener noreferrer">
            Mở trang công khai
          </Link>
        ) : null}
        <Link className="btn-admin" to="/admin/articles">
          Danh sách
        </Link>
      </div>
      <ArticlePreviewErrorBoundary>
        {hasLayout ? (
          <div className="admin-article-view-layout">
            <ArticleBodyFromLayout contentLayout={art.contentLayout} />
          </div>
        ) : (
          <>
            {legacyMedia.map((m, idx) =>
              m.type === "video" ? (
                <p key={m.url + idx}>
                  <video src={m.url} controls style={{ maxWidth: "100%", maxHeight: 360, borderRadius: 10 }} />
                </p>
              ) : (
                <img key={m.url + idx} className="preview-img" src={m.url} alt="" />
              )
            )}
            <div className="article-body-preview" style={{ marginTop: "1rem" }}>
              {art.content || ""}
            </div>
          </>
        )}
      </ArticlePreviewErrorBoundary>
    </div>
  );
}
