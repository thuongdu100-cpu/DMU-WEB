const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getIntroVideo = async (req, res) => {
  try {
    const video = await prisma.media.findFirst({
      where: {
        type: "video",
        is_hero: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    if (!video) {
      return res.status(404).json({ message: "Không có video" });
    }

    res.json({
      url: video.url
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};