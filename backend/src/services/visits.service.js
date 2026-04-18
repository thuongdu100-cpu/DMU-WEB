const fs = require("fs");
const path = require("path");
const config = require("../../config");
const { mondayKeyFromDate, dayKeyFromDate, lastNWeekStartsOffset, lastNDaysOffset } = require("../utils/weeks");

const filePath = path.join(config.paths.data, "visits.json");
const MAX_VISITS = 80000;

function ensureFile() {
  if (!fs.existsSync(config.paths.data)) fs.mkdirSync(config.paths.data, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ visits: [] }, null, 2), "utf8");
  }
}

function load() {
  ensureFile();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const j = JSON.parse(raw);
    return Array.isArray(j.visits) ? j.visits : [];
  } catch {
    return [];
  }
}

function save(visits) {
  ensureFile();
  const trimmed = visits.length > MAX_VISITS ? visits.slice(-MAX_VISITS) : visits;
  fs.writeFileSync(filePath, JSON.stringify({ visits: trimmed }, null, 2), "utf8");
}

function recordVisit(meta) {
  const visits = load();
  visits.push({
    t: new Date().toISOString(),
    path: meta.path || "",
    ref: meta.ref || ""
  });
  save(visits);
}

function weeklyVisitCounts(weeks, blocksBack) {
  const visits = load();
  const buckets = {};
  visits.forEach((v) => {
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

function dailyVisitCounts(days, blocksBack) {
  const visits = load();
  const buckets = {};
  visits.forEach((v) => {
    const k = dayKeyFromDate(v.t);
    if (!k) return;
    buckets[k] = (buckets[k] || 0) + 1;
  });
  const template = lastNDaysOffset(days, blocksBack || 0);
  return template.map(({ key, label }) => ({
    weekKey: key,
    label,
    count: buckets[key] || 0
  }));
}

module.exports = { recordVisit, weeklyVisitCounts, dailyVisitCounts, load };
