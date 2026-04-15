const fs = require("fs");
const path = require("path");
const config = require("../config");
const { mondayKeyFromDate, lastNWeekStartsOffset } = require("../utils/weeks");

const filePath = path.join(config.paths.data, "visits.json");
const MAX_VISITS = 80000;

function ensureFile() {
  if (!fs.existsSync(config.paths.data)) fs.mkdirSync(config.paths.data, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({ visits: [] }, null, 2), "utf8");
}

function load() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { visits: [] };
  }
}

function save(doc) {
  if (doc.visits.length > MAX_VISITS) {
    doc.visits = doc.visits.slice(doc.visits.length - MAX_VISITS);
  }
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf8");
}

function recordVisit(pagePath) {
  const doc = load();
  doc.visits.push({
    t: new Date().toISOString(),
    path: String(pagePath || "/").slice(0, 512)
  });
  save(doc);
}

function weeklyVisitCounts(weeks, blocksBack) {
  const doc = load();
  const buckets = {};
  doc.visits.forEach((v) => {
    const k = mondayKeyFromDate(v.t);
    if (!k) return;
    buckets[k] = (buckets[k] || 0) + 1;
  });
  const template = lastNWeekStartsOffset(weeks, blocksBack || 0);
  return template.map(({ key, label }) => ({
    weekKey: key,
    label,
    count: buckets[key] || 0
  }));
}

module.exports = { recordVisit, weeklyVisitCounts };
