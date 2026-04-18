const { translateErrorString, publicErrorMessage } = require("../utils/vietnameseErrors");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const raw = err.message || "";
  let message;
  if (raw === "Unexpected field" || err.code === "LIMIT_UNEXPECTED_FILE") {
    message = translateErrorString("Unexpected field");
  } else {
    message = publicErrorMessage(err, "L\u1ED7i m\u00E1y ch\u1EE7.");
  }
  res.status(status).json({
    ok: false,
    message
  });
}

module.exports = { errorHandler };
