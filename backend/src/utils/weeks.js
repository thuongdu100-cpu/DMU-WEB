/** Monday start of week (local) for date `d` */
function startOfMondayWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  x.setHours(12, 0, 0, 0);
  return x;
}

function mondayKeyFromDate(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const mon = startOfMondayWeek(d);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, "0");
  const day = String(mon.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayKeyFromDate(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatWeekLabel(monday) {
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  const a = monday.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const b = end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${a} – ${b}`;
}

/**
 * @param {number} blocksBack 0 = window ends this week; each +1 shifts window back by n weeks
 */
function lastNWeekStartsOffset(n, blocksBack) {
  const thisMon = startOfMondayWeek(new Date());
  const b = Math.max(0, parseInt(String(blocksBack), 10) || 0);
  const newest = new Date(thisMon);
  newest.setDate(thisMon.getDate() - b * n * 7);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(newest);
    d.setDate(newest.getDate() - i * 7);
    const key = mondayKeyFromDate(d);
    out.push({ key, label: formatWeekLabel(startOfMondayWeek(d)) });
  }
  return out;
}

function formatDayLabel(dayDate) {
  return dayDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * @param {number} blocksBack 0 = window ends today; each +1 shifts window back by n days
 */
function lastNDaysOffset(n, blocksBack) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const b = Math.max(0, parseInt(String(blocksBack), 10) || 0);
  const newest = new Date(today);
  newest.setDate(today.getDate() - b * n);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(newest);
    d.setDate(newest.getDate() - i);
    const key = dayKeyFromDate(d);
    out.push({ key, label: formatDayLabel(d) });
  }
  return out;
}

module.exports = {
  startOfMondayWeek,
  mondayKeyFromDate,
  dayKeyFromDate,
  formatWeekLabel,
  lastNWeekStartsOffset,
  formatDayLabel,
  lastNDaysOffset
};
