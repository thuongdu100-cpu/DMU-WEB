/** Thứ Hai đầu tuần (local) của ngày `d` */
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

function formatWeekLabel(monday) {
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  const a = monday.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const b = end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${a} – ${b}`;
}

/**
 * N tuần liên tiếp, thứ tự cũ → mới.
 * @param {number} blocksBack 0 = khung kết thúc ở tuần hiện tại; mỗi +1 lùi thêm N tuần (khung 4 tuần trước đó).
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
    out.push({
      key: mondayKeyFromDate(d),
      label: formatWeekLabel(d)
    });
  }
  return out;
}

/** N tuần gần nhất (tuần cũ → mới) — tương đương lastNWeekStartsOffset(n, 0). */
function lastNWeekStarts(n) {
  return lastNWeekStartsOffset(n, 0);
}

module.exports = {
  mondayKeyFromDate,
  lastNWeekStarts,
  lastNWeekStartsOffset,
  formatWeekLabel,
  startOfMondayWeek
};
