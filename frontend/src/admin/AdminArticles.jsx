import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { articleStatusLabel, articleStatusPillClass, isPublishedStatus } from "../utils/articleStatus.js";

export function AdminArticles() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const d = await api("/api/admin/articles");
      setList(d.articles || []);
    } catch (e) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function del(id) {
    if (!confirm("Xoá bài này?")) return;
    try {
      await api("/api/admin/articles/" + id, { method: "DELETE" });
      setMsg("Đã xoá.");
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <>
      <h1 className="admin-h1">Quản lý bài viết</h1>
      {msg ? <div className="admin-msg ok">{msg}</div> : null}
      <div className="admin-card">
        {!list.length ? (
          <p>
            Chưa có bài. <Link to="/admin/article/new">Đăng bài</Link>
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>
                      <span className={"admin-status-pill " + articleStatusPillClass(a.status || "draft")}>
                        {articleStatusLabel(a.status || "draft")}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                      {(a.updatedAt || a.createdAt || "").slice(0, 16).replace("T", " ")}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link className="btn-admin primary" to={"/admin/article/" + a.id}>
                          {isPublishedStatus(a.status) ? "Đọc" : "Xem trước"}
                        </Link>
                        <Link className="btn-admin" to={"/admin/article/" + a.id + "/edit"}>
                          Sửa
                        </Link>
                        <button type="button" className="danger" onClick={() => del(a.id)}>
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
