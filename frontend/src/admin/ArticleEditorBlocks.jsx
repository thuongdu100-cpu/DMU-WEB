import { useRef } from "react";
import { newSlotId } from "../utils/articleMedia.js";

/**
 * @param {{ blocks: object[], setBlocks: (fn: (b: object[]) => object[]) => void }} props
 */
export function ArticleEditorBlocks({ blocks, setBlocks }) {
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);

  function addTextBlock() {
    setBlocks((b) => [...b, { id: newSlotId(), kind: "text", text: "" }]);
  }

  function addMediaFromFile(kind, file) {
    if (!file) return;
    const k = kind === "video" || file.type.startsWith("video/") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file);
    setBlocks((b) => [...b, { id: newSlotId(), kind: k, mode: "new", file, previewUrl }]);
  }

  function moveBlock(i, dir) {
    setBlocks((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function removeBlockAt(i) {
    setBlocks((s) => {
      const slot = s[i];
      if (slot && slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      return s.filter((_, idx) => idx !== i);
    });
  }

  function updateTextAt(i, text) {
    setBlocks((prev) => {
      const copy = [...prev];
      const cur = copy[i];
      if (cur && cur.kind === "text") copy[i] = { ...cur, text };
      return copy;
    });
  }

  return (
    <>
      <p className="admin-lead admin-media-label">Nội dung (đoạn chữ xen một ảnh hoặc một video)</p>
      <p className="admin-lead" style={{ fontSize: "0.85rem", marginTop: "-0.25rem" }}>
        Mỗi lần chỉ chọn một file ảnh/video; dùng ↑ ↓ để đổi thứ tự hiển thị.
      </p>
      <div className="admin-media-toolbar">
        <button type="button" className="btn-admin" onClick={addTextBlock}>
          + Đoạn chữ
        </button>
        <button type="button" className="btn-admin" onClick={() => imgInputRef.current?.click()}>
          + Ảnh
        </button>
        <button type="button" className="btn-admin" onClick={() => vidInputRef.current?.click()}>
          + Video
        </button>
      </div>
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="admin-hidden-input"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          addMediaFromFile("image", e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={vidInputRef}
        type="file"
        accept="video/*"
        className="admin-hidden-input"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          addMediaFromFile("video", e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <ul className="admin-article-blocks">
        {blocks.map((block, i) => (
          <li key={block.id} className="admin-article-block">
            <div className="admin-article-block__head">
              <span className="admin-article-block__label">
                {block.kind === "text" ? "Chữ" : block.kind === "video" ? "Video" : "Ảnh"}
              </span>
              <div className="admin-media-slot__actions">
                <button
                  type="button"
                  className="btn-admin tiny"
                  disabled={i === 0}
                  onClick={() => moveBlock(i, -1)}
                  title="Lên"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-admin tiny"
                  disabled={i === blocks.length - 1}
                  onClick={() => moveBlock(i, 1)}
                  title="Xuống"
                >
                  ↓
                </button>
                <button type="button" className="btn-admin tiny danger" onClick={() => removeBlockAt(i)}>
                  Xoá
                </button>
              </div>
            </div>
            {block.kind === "text" ? (
              <textarea
                id={`text-${block.id}`}
                className="admin-article-block__textarea"
                rows={5}
                value={block.text}
                onChange={(e) => updateTextAt(i, e.target.value)}
                placeholder="Nhập đoạn văn…"
              />
            ) : (
              <div className="admin-article-block__media">
                <div className="admin-media-slot__preview">
                  {block.kind === "image" ? (
                    <img alt="" src={block.previewUrl || block.url || ""} />
                  ) : (
                    <video src={block.previewUrl || block.url || ""} controls />
                  )}
                </div>
                {block.mode === "new" && block.file ? (
                  <p className="admin-article-block__fname">{block.file.name}</p>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
      {!blocks.length ? <p className="admin-lead">Chưa có khối nội dung.</p> : null}
    </>
  );
}
