"use strict";

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const root = path.join(__dirname, "..", "..");

function loadEnv() {
  const dotenv = require("dotenv");
  const rootEnv = path.join(root, ".env");
  if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
  const dbEnv = path.join(root, "backend", "config", "db.env");
  if (fs.existsSync(dbEnv)) dotenv.config({ path: dbEnv });
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error(
      "Thiếu DATABASE_URL. Đặt trong .env hoặc backend/config/db.env"
    );
  }

  // ===============================
  // 1. Seed ADMIN
  // ===============================
  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const plain = process.env.ADMIN_PASSWORD || "admin123";
  const hash = bcrypt.hashSync(String(plain), 10);

  await prisma.admins.upsert({
    where: { username },
    create: { username, password: hash, role: "owner" },
    update: { password: hash, role: "owner" }
  });

  console.log("Seed admin xong:", username, "(role: owner)");

  // ===============================
  // 1b. User AI đăng bài (Bearer), không đăng nhập web
  // ===============================
  const botExisting = await prisma.admins.findUnique({ where: { username: "ai-bot" } });
  const botPassFromEnv = (process.env.AI_BOT_PASSWORD || "").trim();
  if (!botExisting) {
    const plain = botPassFromEnv || crypto.randomBytes(24).toString("base64url");
    const botHash = bcrypt.hashSync(plain, 10);
    await prisma.admins.create({
      data: { username: "ai-bot", password: botHash, role: "bot" }
    });
    console.log(
      "Đã tạo user ai-bot (role: bot). Cấu hình AI_PUBLISH_BEARER_TOKEN (>=16 ký tự) trên server để gọi API đăng bài."
    );
    if (!botPassFromEnv) {
      console.log("Gợi ý: đặt AI_BOT_PASSWORD trong env rồi chạy lại seed nếu cần đặt mật khẩu cố định cho ai-bot (hiếm dùng).");
    }
  } else {
    const patch = { role: "bot" };
    if (botPassFromEnv) {
      patch.password = bcrypt.hashSync(botPassFromEnv, 10);
    }
    await prisma.admins.update({ where: { id: botExisting.id }, data: patch });
    console.log("Cập nhật ai-bot (role: bot).");
  }

  // ===============================
  // 2. Seed VIDEO INTRO
  // ===============================
  const existingVideo = await prisma.media.findFirst({
    where: {
      type: "video",
      filename: "0417.mp4"
    }
  });

  if (!existingVideo) {
    await prisma.media.create({
      data: {
        url: "/uploads/videos/0417.mp4",
        type: "video",
        filename: "0417.mp4",
        mime_type: "video/mp4"
      }
    });

    console.log("Đã seed video intro");
  } else {
    console.log("Video intro đã tồn tại, bỏ qua");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });