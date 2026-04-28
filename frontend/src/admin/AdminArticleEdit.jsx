import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, readResponseJson } from "../api/client.js";
import { buildEditArticleFormData, submitAdminArticleMultipart } from "../api/articleUpload.js";
import { blocksFromArticle } from "../utils/articleLayout.js";
import { articleStatusLabel, articleStatusPillClass, normalizeArticleStatus } from "../utils/articleStatus.js";
import { ArticleEditorBlocks } from "./ArticleEditorBlocks.jsx";

export default function AdminArticleEdit() {
  const { id } = useParams();
  const [art, setArt] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/admin/auth/me", { credentials: "include" });
        const d = await readResponseJson(r);
        if (!cancelled && r.ok && d.admin) setMyRole(d.role || null);
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

  function saveSuccessMessage(status) {
    const normalized = normalizeArticleStatus(status);
    if (normalized === "published") {
      return "Đã lưu. Bài đã được duyệt — đã xuất bản công khai.";
    }
    if (normalized === "pending") {
      return "Đã lưu. Bài đang chờ duyệt (chưa xuất bản công khai).";
    }
    if (normalized === "rejected") {
      return "Đã lưu. Bài đã bị từ chối xuất bản.";
    }
    if (normalized === "draft") {
      return "Đã lưu. Bài chưa được duyệt công khai (đang là nháp).";
    }
    return "Đã lưu.";
  }

  async function save(statusOpt) {
    setMsg("");

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
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const d = await submitAdminArticleMultipart("/api/admin/articles/" + encodeURIComponent(id), {
        method: "PUT",
        formData: fd
      });
      const successMsg = saveSuccessMessage(d.article?.status);
      setMsg(successMsg);
      setArt(d.article);
      setExcerpt(d.article.excerpt || "");
      setBlocks((prev) => {
        prev.forEach((s) => {
          if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        });
        return blocksFromArticle(d.article);
      });
    } catch (e) {
      console.error("[AdminArticleEdit] save error:", e);
      setMsg(e.message || "Lỗi khi cập nhật bài viết.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (err) return <div className="admin-msg error">{err}</div>;
  if (!art) return <p className="admin-lead">Đang tải…</p>;

  const st = normalizeArticleStatus(art?.status);
  const publishCta = myRole === "contributor" ? "Gửi duyệt" : "Xuất bản";

  return (
    <>
      <h1 className="admin-h1">Sửa bài</h1>
      <p className="admin-lead" style={{ fontSize: "0.9rem" }}>
        Trạng thái:{" "}
        <span className={"admin-status-pill " + articleStatusPillClass(st)}>{articleStatusLabel(st)}</span>
        {" · "}
        <Link to={"/admin/article/" + id}>Xem trước / đọc bài</Link>
      </p>
      {msg ? (
        <div className={"admin-msg " + (msg.startsWith("Đã lưu") ? "ok" : "error")}>{msg}</div>
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

        <div className="admin-actions admin-article-save-row">
          <button type="button" className="btn-admin" onClick={() => save("draft")}>
            Lưu nháp
          </button>
          <button type="button" className="btn-admin primary" onClick={() => save("published")}>
            {publishCta}
          </button>
          <button type="button" className="btn-admin" onClick={() => save(undefined)}>
            Chỉ cập nhật nội dung
          </button>
          <Link className="btn-admin" to="/admin/articles">
            Huỷ
          </Link>
        </div>
      </form>
    </>
  );
}
