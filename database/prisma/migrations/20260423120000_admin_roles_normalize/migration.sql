-- =============================================================================
-- Chuẩn hoá role admins: admin | editor | contributor (một file, cập nhật dần).
-- Thay thế luồng cũ admin->owner; map owner/moderator/editor/bot -> mô hình mới.
-- =============================================================================

-- Gỡ tài khoản bot / ai-bot (không còn dùng).
UPDATE "articles" SET "author_id" = NULL
WHERE "author_id" IN (SELECT "id" FROM "admins" WHERE "username" = 'ai-bot' OR lower("role") = 'bot');

DELETE FROM "admins" WHERE "username" = 'ai-bot' OR lower("role") = 'bot';

-- Tránh ghi đè: moderator -> editor trước, editor (người viết) -> contributor sau.
UPDATE "admins" SET "role" = '__was_moderator__' WHERE lower("role") = 'moderator';
UPDATE "admins" SET "role" = '__was_editor__' WHERE lower("role") = 'editor';

UPDATE "admins" SET "role" = 'admin' WHERE lower("role") IN ('owner', 'admin');

UPDATE "admins" SET "role" = 'editor' WHERE "role" = '__was_moderator__';
UPDATE "admins" SET "role" = 'contributor' WHERE "role" = '__was_editor__';

ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'contributor';
