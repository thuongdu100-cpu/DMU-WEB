function health(req, res) {
  res.json({
    ok: true,
    service: "dmu-web-api",
    /** Đối chiếu khi gặp lỗi upload: nếu không phải busboy thì đang gọi nhầm server / bản cũ. */
    uploadParser: "busboy"
  });
}

module.exports = { health };
