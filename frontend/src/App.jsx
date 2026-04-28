import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HashScroll } from "./components/HashScroll.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { NewsDetailPage } from "./pages/NewsDetailPage.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

/* ──────────────────────────────────────────────
   Lazy-loaded admin modules (separate chunk).
   Public users never download this code.
   ────────────────────────────────────────────── */
const AdminShell        = lazy(() => import("./admin/AdminShell.jsx"));
const AdminLogin        = lazy(() => import("./admin/AdminLogin.jsx"));
const AdminDashboard    = lazy(() => import("./admin/AdminDashboard.jsx"));
const AdminArticleNew   = lazy(() => import("./admin/AdminArticleNew.jsx"));
const AdminArticles     = lazy(() => import("./admin/AdminArticles.jsx"));
const AdminArticleView  = lazy(() => import("./admin/AdminArticleView.jsx"));
const AdminArticleEdit  = lazy(() => import("./admin/AdminArticleEdit.jsx"));
const AdminUsers        = lazy(() => import("./admin/AdminUsers.jsx"));

/* Spinner shown while admin chunk is loading */
function AdminFallback() {
  return (
    <div className="admin-wrap" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <p className="admin-lead" style={{ fontSize: "1rem" }}>Đang tải trang quản trị…</p>
    </div>
  );
}

function withAdminBoundary(node) {
  return (
    <ErrorBoundary fallback={<div className="admin-msg error">Trang admin gặp lỗi. Vui lòng tải lại.</div>}>
      {node}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <HashScroll />
      <Routes>
        {/* ── Public routes (eager-loaded) ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />

        {/* ── Admin routes (lazy-loaded, separate chunk) ── */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminShell />
            </Suspense>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={withAdminBoundary(
            <Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>
          )} />
          <Route path="article/new" element={withAdminBoundary(
            <Suspense fallback={<AdminFallback />}><AdminArticleNew /></Suspense>
          )} />
          <Route path="articles" element={withAdminBoundary(
            <Suspense fallback={<AdminFallback />}><AdminArticles /></Suspense>
          )} />
          <Route path="users" element={withAdminBoundary(
            <Suspense fallback={<AdminFallback />}><AdminUsers /></Suspense>
          )} />
          <Route path="article/:id" element={withAdminBoundary(
            <Suspense fallback={<AdminFallback />}><AdminArticleView /></Suspense>
          )} />
          <Route path="article/:id/edit" element={withAdminBoundary(
            <Suspense fallback={<AdminFallback />}><AdminArticleEdit /></Suspense>
          )} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
