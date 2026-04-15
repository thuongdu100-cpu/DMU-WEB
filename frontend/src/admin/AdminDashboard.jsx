import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { api } from "../api/client.js";

const WEEKS_WINDOW = 4;
const MAX_BLOCK = 65;

function maxCount(series) {
  let m = 0;
  (series || []).forEach((x) => {
    if (x.count > m) m = x.count;
  });
  return m || 1;
}

function shortWeekLabel(weekKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(weekKey || ""));
  if (!m) return String(weekKey || "").slice(0, 7);
  return `${Number(m[3])}/${Number(m[2])}`;
}

/** Đường cong Catmull–Rom (qua cubic Bézier) qua các điểm */
function smoothLineThroughPoints(points, tension = 1.35) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  const t = tension;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * t;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * t;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * t;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * t;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function rangeCaption(series) {
  if (!series?.length) return "";
  const a = shortWeekLabel(series[0].weekKey);
  const b = shortWeekLabel(series[series.length - 1].weekKey);
  return `${a} → ${b}`;
}

/**
 * Biểu đồ sóng (đường cong + vùng tô).
 * @param {{ series: { weekKey: string, label: string, count: number }[], title: string, stroke: string, fill: string }} props
 */
function WeekWaveChartSvg({ series, title, stroke, fill }) {
  const areaGradId = useId().replace(/:/g, "_");
  const lineGradId = useId().replace(/:/g, "_");

  const model = useMemo(() => {
    const rows = Array.isArray(series) ? series : [];
    const maxY = maxCount(rows);
    const W = 720;
    const H = 260;
    const pad = { t: 22, r: 18, b: 52, l: 44 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const baseY = pad.t + innerH;
    const n = rows.length;
    const points = rows.map((row, i) => {
      const x = n <= 1 ? pad.l + innerW / 2 : pad.l + (innerW * i) / (n - 1);
      const y = baseY - (row.count / maxY) * innerH;
      return { x, y, ...row };
    });
    const linePath = points.length ? smoothLineThroughPoints(points) : "";
    let areaPath = "";
    if (points.length >= 2) {
      const first = points[0];
      const last = points[points.length - 1];
      areaPath = `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
    } else if (points.length === 1) {
      const p = points[0];
      areaPath = `M ${p.x} ${baseY} L ${p.x} ${p.y} L ${p.x} ${baseY} Z`;
    }
    const tickCount = 5;
    const ticks = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round((maxY * i) / (tickCount - 1)));
    }
    return { W, H, pad, innerW, innerH, baseY, maxY, ticks, points, linePath, areaPath };
  }, [series]);

  if (!model.points.length) {
    return <p className="admin-lead">Chưa có dữ liệu.</p>;
  }

  const { W, H, pad, innerW, innerH, baseY, maxY, ticks, points, linePath, areaPath } = model;

  return (
    <figure className="admin-chart-figure" aria-label={title}>
      <svg
        className="admin-chart-svg admin-wave-svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.75" />
            <stop offset="100%" stopColor={stroke} stopOpacity="1" />
          </linearGradient>
        </defs>

        {ticks.map((tv, i) => {
          const y = pad.t + innerH - (tv / maxY) * innerH;
          return (
            <g key={`grid-${i}`}>
              <line
                x1={pad.l}
                y1={y}
                x2={pad.l + innerW}
                y2={y}
                stroke="var(--border-subtle)"
                strokeOpacity="0.75"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={pad.l - 6}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-body)"
                fontSize="11"
                fontFamily="system-ui, sans-serif"
              >
                {tv}
              </text>
            </g>
          );
        })}

        <line
          x1={pad.l}
          y1={baseY}
          x2={pad.l + innerW}
          y2={baseY}
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {areaPath ? <path d={areaPath} fill={`url(#${areaGradId})`} className="admin-wave-area" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="admin-wave-line"
          />
        ) : null}

        {points.map((p) => (
          <g key={p.weekKey}>
            <circle cx={p.x} cy={p.y} r="7" fill="var(--bg-card)" stroke={stroke} strokeWidth="2" className="admin-wave-dot">
              <title>
                {p.label}: {p.count}
              </title>
            </circle>
            <text
              x={p.x}
              y={baseY + 20}
              textAnchor="middle"
              fill="var(--text-body)"
              fontSize="10"
              fontFamily="system-ui, sans-serif"
            >
              {shortWeekLabel(p.weekKey)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="admin-chart-caption">
        Di chuột vào điểm trên sóng để xem đủ khoảng tuần và số liệu.
      </figcaption>
    </figure>
  );
}

export function AdminDashboard() {
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [block, setBlock] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (b) => {
    setLoading(true);
    setErr("");
    try {
      const d = await api(`/api/admin/dashboard?weeks=${WEEKS_WINDOW}&block=${b}`);
      setData(d);
      setBlock(typeof d.block === "number" ? d.block : b);
    } catch (e) {
      setErr(e.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  function goOlder() {
    if (block >= MAX_BLOCK) return;
    load(block + 1);
  }

  function goNewer() {
    if (block <= 0) return;
    load(block - 1);
  }

  if (!data && loading) return <p className="admin-lead">Đang tải…</p>;
  if (!data && err) return <div className="admin-msg error">{err}</div>;
  if (!data) return <p className="admin-lead">Chưa có dữ liệu.</p>;

  const rangeVisits = rangeCaption(data.visitsByWeek);
  const rangeArticles = rangeCaption(data.articlesPublishedByWeek);

  return (
    <>
      <h1 className="admin-h1">Dashboard</h1>
      <p className="admin-lead">
        Mỗi lần hiển thị <strong>4 tuần</strong> (biểu đồ sóng). Dùng nút để xem <strong>4 tuần trước đó</strong> hoặc quay lại
        gần hiện tại.
      </p>

      <div className="admin-chart-nav" role="group" aria-label="Chọn khung thời gian">
        <button type="button" className="btn-admin" disabled={block >= MAX_BLOCK || loading} onClick={goOlder}>
          ← 4 tuần trước
        </button>
        <span className="admin-chart-nav-meta">
          {loading ? "Đang tải…" : `Khung ${block + 1}${rangeVisits ? ` · ${rangeVisits}` : ""}`}
        </span>
        <button type="button" className="btn-admin" disabled={block <= 0 || loading} onClick={goNewer}>
          4 tuần sau →
        </button>
      </div>
      {err ? <div className="admin-msg error" style={{ marginTop: "0.5rem" }}>{err}</div> : null}

      <div className="admin-card admin-chart-card">
        <h2>Lượt truy cập</h2>
        <p className="admin-chart-sub">Theo analytics trên site · {rangeVisits}</p>
        <WeekWaveChartSvg
          series={data.visitsByWeek}
          title="Lượt truy cập theo tuần"
          stroke="rgb(56, 189, 248)"
          fill="rgb(56, 189, 248)"
        />
      </div>

      <div className="admin-card admin-chart-card">
        <h2>Bài viết đã xuất bản</h2>
        <p className="admin-chart-sub">Theo ngày tạo bài (đã đăng) · {rangeArticles}</p>
        <WeekWaveChartSvg
          series={data.articlesPublishedByWeek}
          title="Số bài đăng theo tuần"
          stroke="rgb(74, 222, 128)"
          fill="rgb(74, 222, 128)"
        />
      </div>
    </>
  );
}
