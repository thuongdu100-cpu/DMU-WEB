import { Navigate, Route, Routes } from "react-router-dom";
import { HashScroll } from "./components/HashScroll.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { NewsDetailPage } from "./pages/NewsDetailPage.jsx";
import { AdminShell } from "./admin/AdminShell.jsx";
import { AdminLogin } from "./admin/AdminLogin.jsx";
import { AdminDashboard } from "./admin/AdminDashboard.jsx";
import { AdminArticleNew } from "./admin/AdminArticleNew.jsx";
import { AdminArticles } from "./admin/AdminArticles.jsx";
import { AdminArticleView } from "./admin/AdminArticleView.jsx";
import { AdminArticleEdit } from "./admin/AdminArticleEdit.jsx";
import { AdminUsers } from "./admin/AdminUsers.jsx";

export default function App() {
  return (
    <>
      <HashScroll />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="article/new" element={<AdminArticleNew />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="article/:id" element={<AdminArticleView />} />
          <Route path="article/:id/edit" element={<AdminArticleEdit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
