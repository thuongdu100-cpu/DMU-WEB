import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { buildEditArticleFormData, submitAdminArticleMultipart } from "../api/articleUpload.js";
import { blocksFromArticle } from "../utils/articleLayout.js";
import { ArticleEditorBlocks } from "./ArticleEditorBlocks.jsx";

export function AdminArticleEdit() {
  const { id } = useParams();
  const [art, setArt] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [resultPayload, setResultPayload] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api("/api/admin/articles/" + encodeURIComponent(id));
        const a = d.article;
        setArt(a);
        setTitle(a.title || "");
        setExcerpt(a.excerpt || "");
        setBlocks(blocksFromArticle(a));
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  async function save(statusOpt) {
    setMsg("");
    setResultPayload(null);

    let fd;
    try {
      fd = buildEditArticleFormData({
        title,
        excerpt,
        blocks,
        ...(statusOpt !== undefined ? { status: statusOpt } : {})
      });
    } catch (err) {
      setMsg(err.message || "Kiểm tra ảnh/video đã chọn file chưa.");
      return;
    }

    try {
      const d = await submitAdminArticleMultipart("/api/admin/articles/" + encodeURIComponent(id), {
        method: "PUT",
        formData: fd
      });
      setMsg("Đã lưu.");
      setArt(d.article);
      setResultPayload({
        blog: d.blog || d.article || d.post || null,
        images: Array.isArray(d.images) ? d.images : [],
        videos: Array.isArray(d.videos) ? d.videos : [],
        media: Array.isArray(d.media) ? d.media : []
      });
      setExcerpt(d.article.excerpt || "");
      setBlocks((prev) => {
        prev.forEach((s) => {
          if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        });
        return blocksFromArticle(d.article);
      });
    } catch (e) {
      setMsg(e.message || "Lỗi");
    }
  }

  if (err) return <div className="admin-msg error">{err}</div>;
  if (!art) return <p className="admin-lead">Đang tải…</p>;

  const isDraft = art.status === "draft";

  return (
    <>
      <h1 className="admin-h1">Sửa bài</h1>
      <p className="admin-lead" style={{ fontSize: "0.9rem" }}>
        Trạng thái:{" "}
        <span className={"admin-status-pill " + (isDraft ? "admin-status-pill--draft" : "admin-status-pill--live")}>
          {isDraft ? "Nháp (chưa công khai)" : "Đã xuất bản"}
        </span>
        {" · "}
        <Link to={"/admin/article/" + id}>Xem trước / đọc bài</Link>
      </p>
      {msg ? <div className={"admin-msg " + (msg === "Đã lưu." ? "ok" : "error")}>{msg}</div> : null}
      {resultPayload ? (
        <div className="admin-card admin-result-card">
          <h2>Payload trả về từ API</h2>
          <p className="admin-lead" style={{ marginBottom: "0.75rem" }}>
            Blog ID: <strong>{resultPayload.blog?.id ?? "(không có)"}</strong>
          </p>
          <p className="admin-result-line">
            <strong>images:</strong> {resultPayload.images.length}
          </p>
          <p className="admin-result-line">
            <strong>videos:</strong> {resultPayload.videos.length}
          </p>
          <p className="admin-result-line">
            <strong>media:</strong> {resultPayload.media.length}
          </p>
          <pre className="admin-result-json">{JSON.stringify(resultPayload, null, 2)}</pre>
        </div>
      ) : null}
      <form className="admin-form admin-card" encType="multipart/form-data" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="title">Tiêu đề *</label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={500}
          autoComplete="off"
        />

        <label htmlFor="excerpt">Tóm tắt hiển thị</label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Hiển thị trên trang chủ"
        />

        <ArticleEditorBlocks blocks={blocks} setBlocks={setBlocks} />

        <div className="btn-row admin-article-save-row">
          <button type="button" className="btn btn-secondary" onClick={() => save("draft")}>
            Lưu nháp
          </button>
          <button type="button" className="btn btn-primary" onClick={() => save("published")}>
            Xuất bản
          </button>
          <button type="button" className="btn-admin" onClick={() => save(undefined)}>
            Chỉ cập nhật nội dung
          </button>
          <Link to="/admin/articles" style={{ marginLeft: "1rem" }}>
            Huỷ
          </Link>
        </div>
      </form>
    </>
  );
}
