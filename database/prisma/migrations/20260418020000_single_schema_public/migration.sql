-- =============================================================
--  DMU — Migration: 20260418020000_single_schema_public
--  Chuyển về 1 schema: public (bỏ multiSchema admin/content/media)
-- =============================================================

-- Xoá bảng cũ (multi-schema) nếu còn tồn tại
DROP TABLE IF EXISTS "media"."content_media"    CASCADE;
DROP TABLE IF EXISTS "content"."content_layout" CASCADE;
DROP TABLE IF EXISTS "content"."article_tags"   CASCADE;
DROP TABLE IF EXISTS "content"."articles"       CASCADE;
DROP TABLE IF EXISTS "content"."tags"           CASCADE;
DROP TABLE IF EXISTS "content"."categories"     CASCADE;
DROP TABLE IF EXISTS "media"."media"            CASCADE;
DROP TABLE IF EXISTS "admin"."admins"           CASCADE;
DROP SCHEMA IF EXISTS "admin"   CASCADE;
DROP SCHEMA IF EXISTS "content" CASCADE;
DROP SCHEMA IF EXISTS "media"   CASCADE;

-- Xoá bảng public cũ (nếu có từ migration init)
DROP TABLE IF EXISTS "public"."content_media"   CASCADE;
DROP TABLE IF EXISTS "public"."content_layout"  CASCADE;
DROP TABLE IF EXISTS "public"."article_tags"    CASCADE;
DROP TABLE IF EXISTS "public"."articles"        CASCADE;
DROP TABLE IF EXISTS "public"."tags"            CASCADE;
DROP TABLE IF EXISTS "public"."categories"      CASCADE;
DROP TABLE IF EXISTS "public"."media"           CASCADE;
DROP TABLE IF EXISTS "public"."admins"          CASCADE;

-- =============================================================
--  1. admins
-- =============================================================
CREATE TABLE "admins" (
    "id"         SERIAL       NOT NULL,
    "username"   TEXT         NOT NULL,
    "password"   TEXT         NOT NULL,
    "role"       TEXT         NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- =============================================================
--  2. categories
-- =============================================================
CREATE TABLE "categories" (
    "id"          SERIAL       NOT NULL,
    "name"        TEXT         NOT NULL,
    "slug"        TEXT         NOT NULL,
    "description" TEXT         NOT NULL DEFAULT '',
    "parent_id"   INTEGER,
    "created_at"  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE        INDEX "categories_slug_idx" ON "categories"("slug");

ALTER TABLE "categories"
    ADD CONSTRAINT "categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
--  3. tags
-- =============================================================
CREATE TABLE "tags" (
    "id"   SERIAL NOT NULL,
    "name" TEXT   NOT NULL,
    "slug" TEXT   NOT NULL,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
CREATE        INDEX "tags_slug_idx" ON "tags"("slug");

-- =============================================================
--  4. articles
-- =============================================================
CREATE TABLE "articles" (
    "id"           SERIAL       NOT NULL,
    "title"        TEXT         NOT NULL,
    "slug"         TEXT         NOT NULL,
    "excerpt"      TEXT         NOT NULL DEFAULT '',
    "content"      TEXT         NOT NULL DEFAULT '',
    "thumbnail"    TEXT,
    "status"       TEXT         NOT NULL DEFAULT 'draft',
    "view_count"   INTEGER      NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(6),
    "created_at"   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id"    INTEGER,
    "category_id"  INTEGER,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "articles_slug_key"      ON "articles"("slug");
CREATE        INDEX "articles_status_idx"    ON "articles"("status");
CREATE        INDEX "articles_slug_idx"      ON "articles"("slug");
CREATE        INDEX "articles_published_idx" ON "articles"("published_at");
CREATE        INDEX "articles_updated_idx"   ON "articles"("updated_at");

ALTER TABLE "articles"
    ADD CONSTRAINT "articles_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "admins"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "articles"
    ADD CONSTRAINT "articles_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
--  5. article_tags
-- =============================================================
CREATE TABLE "article_tags" (
    "article_id" INTEGER NOT NULL,
    "tag_id"     INTEGER NOT NULL,
    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id", "tag_id")
);
ALTER TABLE "article_tags"
    ADD CONSTRAINT "article_tags_article_id_fkey"
    FOREIGN KEY ("article_id") REFERENCES "articles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_tags"
    ADD CONSTRAINT "article_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
--  6. content_layout
-- =============================================================
CREATE TABLE "content_layout" (
    "id"         SERIAL   NOT NULL,
    "article_id" INTEGER  NOT NULL,
    "type"       TEXT     NOT NULL,
    "content"    TEXT     NOT NULL DEFAULT '',
    "position"   INTEGER  NOT NULL,
    "metadata"   JSONB,
    CONSTRAINT "content_layout_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "content_layout_article_id_idx" ON "content_layout"("article_id");

ALTER TABLE "content_layout"
    ADD CONSTRAINT "content_layout_article_id_fkey"
    FOREIGN KEY ("article_id") REFERENCES "articles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
--  7. media
-- =============================================================
CREATE TABLE "media" (
    "id"          SERIAL       NOT NULL,
    "url"         TEXT         NOT NULL,
    "type"        TEXT         NOT NULL,
    "filename"    TEXT,
    "mime_type"   TEXT,
    "size_bytes"  INTEGER,
    "created_at"  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- =============================================================
--  8. content_media
-- =============================================================
CREATE TABLE "content_media" (
    "id"         SERIAL  NOT NULL,
    "content_id" INTEGER NOT NULL,
    "media_id"   INTEGER NOT NULL,
    CONSTRAINT "content_media_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "content_media_content_id_media_id_key"
    ON "content_media"("content_id", "media_id");

ALTER TABLE "content_media"
    ADD CONSTRAINT "content_media_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "content_layout"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_media"
    ADD CONSTRAINT "content_media_media_id_fkey"
    FOREIGN KEY ("media_id") REFERENCES "media"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
