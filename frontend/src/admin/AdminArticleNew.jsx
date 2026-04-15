import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildNewArticleFormData, submitAdminArticleMultipart } from "../api/articleUpload.js";
import { blocksFromArticle } from "../utils/articleLayout.js";
import { ArticleEditorBlocks } from "./ArticleEditorBlocks.jsx";

export function AdminArticleNew() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [blocks, setBlocks] = useState(() => blocksFromArticle(null));

  async function saveWithStatus(status) {
    setMsg("");
    const titleEl = document.getElementById("title");
    const excerptEl = document.getElementById("excerpt");
    const title = titleEl?.value ?? "";
    const excerpt = excerptEl?.value ?? "";
    if (!title.trim()) {
      setMsg("Nhập tiêu đề trước khi lưu.");
      titleEl?.focus();
      return;
    }

    let fd;
    try {
      fd = buildNewArticleFormData({ title, excerpt, blocks, status });
    } catch (err) {
      setMsg(err.message || "Kiểm tra ảnh/video đã chọn file chưa.");
      return;
    }

    try {
      const d = await submitAdminArticleMultipart("/api/admin/articles", {
        method: "POST",
        formData: fd
      });
      const id = d.article?.id;
      if (status === "draft" && id) {
        setMsg("Đã lưu nháp. Mở “Xem trước” trong danh sách bài để duyệt trước khi đăng.");
        navigate("/admin/article/" + id);
        return;
      }
      setMsg("Đã đăng bài #" + id);
      setBlocks((prev) => {
        prev.forEach((s) => {
          if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        });
        return blocksFromArticle(null);
      });
      if (titleEl) titleEl.value = "";
      if (excerptEl) excerptEl.value = "";
    } catch (err) {
      setMsg(err.message || "Lỗi");
    }
  }

  return (
    <>
      <h1 className="admin-h1">Đăng bài mới</h1>
      <p className="admin-lead">
        Soạn theo khối; có thể <strong>lưu nháp</strong> để xem trước trong admin, rồi <strong>đăng bài</strong> khi sẵn
        sàng. Bài nháp không hiển thị trên trang tin công khai.
      </p>
      {msg ? <div className={"admin-msg " + (msg.startsWith("Đã") ? "ok" : "error")}>{msg}</div> : null}
      <form
        className="admin-form admin-card"
        encType="multipart/form-data"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="title">Tiêu đề *</label>
        <input id="title" name="title" type="text" required maxLength={500} />

        <label htmlFor="excerpt">Tóm tắt hiển thị (tùy chọn)</label>
        <textarea
          id="excerpt"
          name="excerpt"
          placeholder="Hiển thị trên trang chủ. Để trống sẽ tự lấy từ nội dung."
          rows={3}
          maxLength={2000}
        />

        <ArticleEditorBlocks blocks={blocks} setBlocks={setBlocks} />

        <div className="btn-row admin-article-save-row">
          <button type="button" className="btn btn-secondary" onClick={() => saveWithStatus("draft")}>
            Lưu nháp
          </button>
          <button type="button" className="btn btn-primary" onClick={() => saveWithStatus("published")}>
            Đăng bài
          </button>
          <Link to="/admin/articles" style={{ marginLeft: "1rem" }}>
            Danh sách
          </Link>
        </div>
      </form>
    </>
  );
}
