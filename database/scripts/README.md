# Custom SQL (tuy chon)

- Dat file `.sql` o day khi can chay **ngoai** Prisma Migrate (extension, view, seed SQL tho, ...).
- Chay: `npm run db:run-sql-scripts` (xem `backend/db/init-db-script.js`).
- **Khuyen:** moi file mot hoac vai lenh don gian. Tranh nhieu cau `;` phuc tap trong mot file (de tach file).
- **Code-first chinh:** van dung `schema.prisma` + `npm run db:migrate` / `db:migrate:deploy`.
