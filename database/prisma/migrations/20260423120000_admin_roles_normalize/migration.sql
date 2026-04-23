-- Chuẩn hóa role legacy: admin -> owner (tài khoản chủ)
UPDATE "admins" SET "role" = 'owner' WHERE "role" = 'admin';
