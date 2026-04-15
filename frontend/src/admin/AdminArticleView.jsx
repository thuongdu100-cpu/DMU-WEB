import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { mediaDisplayList } from "../utils/articleMedia.js";
import { ArticleBodyFromLayout } from "../components/ArticleBodyFromLayout.jsx";

export function AdminArticleView() {
  const { id } = useParams();
  const [art, setArt] = useState(null);
  const [err, setErr] = useState("");

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

  const hasLayout = Array.isArray(art.contentLayout) && art.contentLayout.length > 0;
  const legacyMedia = !hasLayout ? mediaDisplayList(art) : [];

  const isDraft = art.status === "draft";

  return (
    <div className="admin-card">
      {isDraft ? (
        <div className="admin-msg draft-banner" role="status">
          <strong>Bản nháp</strong> — chỉ xem trong admin. Trang tin công khai chưa hiển thị bài này. Khi duyệt xong,
          mở Sửa bài và bấm <strong>Xuất bản</strong>.
        </div>
      ) : null}
      <h1 className="admin-h1" style={{ fontSize: "1.35rem" }}>
        {art.title}
      </h1>
      <p className="admin-lead" style={{ fontSize: "0.8rem" }}>
        Tạo: {(art.createdAt || "").replace("T", " ").slice(0, 19)}
        {" · "}
        <span className={"admin-status-pill " + (isDraft ? "admin-status-pill--draft" : "admin-status-pill--live")}>
          {isDraft ? "Nháp" : "Đã đăng"}
        </span>
      </p>
      {art.excerpt ? (
        <p className="admin-lead" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
          <strong>Tóm tắt:</strong> {art.excerpt}
        </p>
      ) : null}
      <div className="admin-actions" style={{ marginBottom: "1rem" }}>
        <Link className="btn-admin primary" to={"/admin/article/" + id + "/edit"}>
          Sửa
        </Link>
        {!isDraft ? (
          <Link className="btn-admin" to={"/news/" + id} target="_blank" rel="noopener noreferrer">
            Mở trang công khai
          </Link>
        ) : null}
        <Link className="btn-admin" to="/admin/articles">
          Danh sách
        </Link>
      </div>
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
    </div>
  );
}
