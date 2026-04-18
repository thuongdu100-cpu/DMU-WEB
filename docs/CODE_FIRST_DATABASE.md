# Code-first PostgreSQL + Prisma Migrate

## Schema- File: `database/prisma/schema.prisma`
- `provider = "postgresql"` trong `datasource db`.

## Bien moi truong

- **`DATABASE_URL`** bat buoc cho `migrate` / runtime.
- Du an nap: `.env` (goc) roi `backend/config/db.env` (xem `scripts/prisma-env.cjs`, `backend/config/index.js`).
- Co the chi dung **mot** noi: khuyen dat URL trong `backend/config/db.env`.

## Lenh chinh

| Lenh | Muc dich |
|------|----------|
| `npm run db:migrate` | Dev: tao migration moi khi doi schema (Prisma hoi ten). |
| `npm run db:migrate:init-structure` | Tuong duong `migrate dev --name init_structure` (khi can ten co dinh). |
| `npm run db:migrate:deploy` | May moi / CI / prod: ap tat ca migration da commit. |
| `npm run db:run-sql-scripts` | Chay file `.sql` tin cay trong `database/scripts/` (xem `backend/db/init-db-script.js`). |

## Thu muc Migrations hien tai

Sau khi chuan hoa ten file theo Prisma:

- `database/prisma/migrations/migration_lock.toml` — khoa provider `postgresql`.
- `database/prisma/migrations/20260417120000_init/migration.sql` — migration dau: bang `admins`, `articles`, `content_layout`, `media`, `content_media`, index, FK.

*(Neu ban chay `npm run db:migrate` va doi schema, se xuat hien them thu muc `YYYYMMDDHHMMSS_ten_migration/` + `migration.sql`.)*

## Mang folder `migrations` sang may khac

1. **Copy ca thu muc** `database/prisma/migrations/` (va `schema.prisma`) vao cung vi tri trong repo tren may dich.
2. Tao database Postgres trong (hoac dung DB rong).
3. Dat `DATABASE_URL` dung tren may dich.
4. Chay:
   ```bash
   npm install
   npm run db:migrate:deploy
   ```
   Prisma se:
   - doc lich su trong `_prisma_migrations`,
   - chay lan luot moi `migration.sql` chua ap.

**Khong** can copy tay tung file SQL vao pgAdmin neu ban dung `migrate deploy` — Prisma la nguon that. Chi can import tay SQL neu ban **khong** dung Prisma tren may dich.

## Kiem tra ket noi API

- `GET /api/health` — health + query DB (qua controller hien tai).
- `GET /api/db-ping` — chi `SELECT 1` qua Prisma.
