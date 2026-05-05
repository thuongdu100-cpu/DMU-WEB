# DMU NEWS — React (Vite) + Express + PostgreSQL (Prisma)

## Quick start (Prisma Migrate)

```bash
npm install
# Dien DATABASE_URL trong backend/config/db.env (xem db.env.example)
```

**Moi truong dev** — tao migration moi khi doi `schema.prisma`, ap dung vao DB local:

```bash
npm run db:migrate
```

Lan dau hoac may moi (chi ap cac file trong `database/prisma/migrations/`, khong hoi ten migration):

```bash
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Hoac mot lenh: `npm run db:init` (= `migrate deploy` + `seed`).

**Production / CI** — chi ap migration da commit:

```bash
npm run db:migrate:deploy
```

**Luu y:** lan dau chay video intro.
- chay cac buoc o tren
- Chi 1 video duy nhat duoc phep co `is_hero = true`
- Neu khong co video nao duoc set -> trang chu se khong hien thi video
- He thong khong tu dong seed dung neu thieu cau hinh

```bash
# nam trong table media cua db, chỉ cần set gia tri
is_hero = true
```
  
**Luu y:** `db:push` van co trong package (thu nhanh, khong ghi lich su). Du an chinh thuc nen dung **migrate**.

**Prisma & `DATABASE_URL`:** Cac lenh `db:*` dung `scripts/prisma-env.cjs` de nap `.env` goc roi `backend/config/db.env`. Chay `npm run db:migrate:deploy` tu **thu muc goc** `DMUWeb`.

**Code-first & migrations / SQL tuy chon:** [docs/CODE_FIRST_DATABASE.md](docs/CODE_FIRST_DATABASE.md) — liet ke thu muc migration, cach mang `migrations` sang may khac, `db:run-sql-scripts`, `GET /api/db-ping`.

File khung env: `backend/config/db.env`, `.env` o goc — trong `.gitignore`.

Sau `db:seed`: dang nhap admin theo `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `db.env`.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, `buildApp`, data flow  
