import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Sau khi chuyển về trang chủ kèm hash (vd. /#tin-tuc), cuộn tới đúng section.
 * React Router không tự scroll tới hash khi đổi route.
 */
export function HashScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== "/" || !hash) return;
    const id = hash.replace(/^#/, "");
    if (!id) return;

    const scrollTo = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollTo();
    const t1 = window.setTimeout(scrollTo, 80);
    const t2 = window.setTimeout(scrollTo, 220);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, hash]);

  return null;
}
