# DMU NEWS — React + Express + SQLite

Trang tin nội bộ: frontend React (Vite), API Express, dữ liệu **SQLite** (`database.sqlite` ở thư mục gốc), file upload vào `uploads/images` và `uploads/videos`.

## Yêu cầu

- **Node.js ≥ 22.5** (dùng module `node:sqlite` có sẵn; không cần cài thêm driver SQLite qua npm).

## Chạy nhanh

```bash
npm install
npm start
```

Mặc định API: `http://localhost:3000`. Server tự tạo `database.sqlite`, bảng `posts`, và thư mục upload nếu chưa có.

Khởi tạo DB thủ công (tuỳ chọn):

```bash
npm run db:init
```

Giao diện dev (Vite proxy `/api`, `/uploads`, `/posts`):

```bash
npm run client
```

Hoặc chạy song song API + web:

```bash
npm run dev
```

Build SPA và phục vụ tĩnh từ Express:

```bash
npm run build
npm start
```

## Cấu trúc backend (MVC)

| Thư mục / file | Vai trò |
|----------------|---------|
| `backend/models/database.js` | Mở SQLite, tạo bảng `posts` |
| `backend/models/post.model.js` | CRUD, JSON `images`/`videos`, thống kê tuần |
| `backend/controllers/posts.controller.js` | Xử lý HTTP + multipart |
| `backend/middlewares/uploadPostFiles.js` | Multer: ảnh/video, giới hạn dung lượng & MIME |
| `backend/routes/posts.routes.js` | REST `/posts` |
| `backend/routes/admin/adminArticles.routes.js` | `/api/admin/articles` (cần đăng nhập admin) |
| `backend/routes/api/publicArticles.routes.js` | `/api/public/articles` (đọc tin công khai) |

## API chính

### REST (theo đề bài)

| Phương thức | Đường dẫn | Ghi chú |
|-------------|-----------|---------|
| GET | `/posts` | Danh sách bài (đầy đủ trường) |
| GET | `/posts/:id` | Chi tiết (id số) |
| POST | `/posts` | Tạo bài — **cần cookie admin** (session) |
| PUT | `/posts/:id` | Cập nhật — **cần admin** |
| DELETE | `/posts/:id` | Xoá bài + file — **cần admin** |

### Tương thích ứng dụng hiện tại

- `GET /api/public/articles` — danh sách rút gọn cho trang chủ  
- `GET /api/public/articles/:id` — chi tiết bài (công khai toàn bộ nội dung)  
- `GET|POST|PUT|DELETE /api/admin/articles` — quản trị (session admin)

## Ví dụ `fetch`

Đăng nhập admin (session cookie):

```js
await fetch("/api/admin/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ username: "admin", password: "admin123" })
});
```

Tạo bài kèm file (`FormData`):

```js
const fd = new FormData();
fd.append("title", "Tiêu đề");
fd.append("content", "<p>Nội dung HTML</p>");
fd.append("excerpt", "Tóm tắt");
fd.append("images", fileInput.files[0]); // lặp append "images" nếu nhiều ảnh
fd.append("videos", videoInput.files[0]); // nhiều file: append nhiều lần "videos"

await fetch("/posts", {
  method: "POST",
  credentials: "include",
  body: fd
});
```

GET danh sách:

```js
const res = await fetch("/posts");
const data = await res.json(); // { ok, posts }
```

## Hiển thị media trên React

- Ảnh: mảng `article.images` — mỗi phần tử là URL dạng `/uploads/images/...` (dùng trực tiếp làm `src` của `<img>`).
- Video: mảng `article.videos` (hoặc fallback `article.video` nếu cần tương thích) — `/uploads/videos/...` cho `<video src={...} />`.
- Dev server Vite đã proxy `/uploads` sang Express nên đường dẫn tương đối hoạt động như cũ.

## Ghi chú

- Node có thể in cảnh báo *ExperimentalWarning* cho SQLite — đó là hành vi của `node:sqlite`, không ảnh hưởng chạy thử local.
- MIME được phép: ảnh JPEG/PNG/GIF/WebP; video MP4/WebM/MOV/WMV. Giới hạn ~80MB mỗi file (cấu hình trong `uploadPostFiles.js`).
