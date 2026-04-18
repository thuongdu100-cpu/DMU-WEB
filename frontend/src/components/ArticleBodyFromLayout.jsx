/**
 * Hiển thị bài theo contentLayout (đoạn chữ xen ảnh/video).
 */
export function ArticleBodyFromLayout({ contentLayout }) {
  if (!Array.isArray(contentLayout) || contentLayout.length === 0) return null;

  return (
    <div className="article-layout-flow">
      {contentLayout.map((b, idx) => {
        if (!b || typeof b !== "object") return null;
        if (b.type === "text") {
          const key = `t-${idx}`;
          return (
            <div key={key} className="article-body">
              {String(b.text ?? "")}
            </div>
          );
        }
        if (b.type === "video" && typeof b.url === "string") {
          return (
            <video
              key={`v-${b.url}-${idx}`}
              className="article-video article-gallery__media"
              src={b.url}
              controls
              playsInline
            />
          );
        }
        if (b.type === "image" && typeof b.url === "string") {
          return (
            <img
              key={`i-${b.url}-${idx}`}
              className="article-gallery__img"
              src={b.url}
              alt=""
              loading="lazy"
            />
          );
        }
        return null;
      })}
    </div>
  );
}
