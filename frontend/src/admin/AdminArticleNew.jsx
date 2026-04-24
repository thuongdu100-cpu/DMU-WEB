import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readResponseJson } from "../api/client.js";
import { buildNewArticleFormData, submitAdminArticleMultipart } from "../api/articleUpload.js";
import { blocksFromArticle } from "../utils/articleLayout.js";
import { ArticleEditorBlocks } from "./ArticleEditorBlocks.jsx";

export function AdminArticleNew() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [blocks, setBlocks] = useState(() => blocksFromArticle(null));
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
      const createdStatus = d.article?.status;
      if (status === "draft" && id) {
        setMsg("Đã lưu nháp (chưa duyệt công khai). Mở “Xem trước” trong danh sách bài khi cần.");
        navigate("/admin/article/" + id);
        return;
      }
      if (id && createdStatus === "pending") {
        setMsg("Đã gửi bài #" + id + " chờ duyệt. Editor hoặc admin sẽ xuất bản khi đồng ý.");
        navigate("/admin/article/" + id);
        return;
      }
      setMsg("Đã đăng bài #" + id + ". Bài đã được duyệt và hiển thị công khai.");
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
        Soạn theo khối; <strong>lưu nháp</strong> để tiếp tục sau.{" "}
        {myRole === "contributor" ? (
          <>
            Với tài khoản <strong>contributor</strong>, nút <strong>Đăng bài</strong> gửi bài ở trạng thái{" "}
            <strong>chờ duyệt</strong> (chưa lên trang công khai cho đến khi editor/admin xuất bản).
          </>
        ) : (
          <>
            <strong>Đăng bài</strong> xuất bản công khai (admin / editor). Bài nháp hoặc chờ duyệt không hiển thị trên
            trang tin công khai.
          </>
        )}
      </p>
      {msg ? (
        <div className={"admin-msg " + (msg.startsWith("Đã") ? "ok" : "error")}>{msg}</div>
      ) : null}
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

        <div className="admin-actions admin-article-save-row">
          <button type="button" className="btn-admin" onClick={() => saveWithStatus("draft")}>
            Lưu nháp
          </button>
          <button type="button" className="btn-admin primary" onClick={() => saveWithStatus("published")}>
            {myRole === "contributor" ? "Gửi duyệt" : "Đăng bài"}
          </button>
          <Link className="btn-admin" to="/admin/articles">
            Danh sách
          </Link>
        </div>
      </form>
    </>
  );
}
