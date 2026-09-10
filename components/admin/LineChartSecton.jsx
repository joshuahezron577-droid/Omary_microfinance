'use client';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/superbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Tengeneza miezi 6 iliyopita kutoka leo
function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year:  d.getFullYear(),
      month: d.getMonth(), // 0-indexed
      label: MONTH_NAMES[d.getMonth()],
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return months;
}

// Hesabu jumla ya disbursements kwa kila mwezi
function buildChartData(loans) {
  const months = getLast6Months();

  // Panga loans kwa mwezi
  const totals = {};
  months.forEach(m => { totals[m.key] = 0; });

  loans.forEach(loan => {
    if (!['active', 'completed'].includes(loan.status)) return;
    const d = new Date(loan.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (totals[key] !== undefined) {
      totals[key] += Number(loan.amount || 0);
    }
  });

  return months.map(m => ({
    label:  m.label,
    key:    m.key,
    amount: totals[m.key],
  }));
}

// Format kwa axis labels
function fmtAxis(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return String(n);
}

const fmt = (n) =>
  `TZS ${Number(n).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

// ─── SVG Chart ───────────────────────────────────────────────────────────────

function LineChart({ data }) {
  const [hovered, setHovered] = useState(null);

  const W = 700, H = 150;
  const PAD_L = 10, PAD_R = 10, PAD_T = 10, PAD_B = 10;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data.map(d => d.amount), 1);
  // Y gridlines — 4 levels
  const yLevels = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(maxVal * r));

  // Coordinates za kila point
  const points = data.map((d, i) => ({
    x: PAD_L + (i / (data.length - 1)) * chartW,
    y: PAD_T + chartH - (d.amount / maxVal) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div className="relative w-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-36 flex flex-col justify-between pointer-events-none pr-1" style={{width: 36}}>
        {[...yLevels].reverse().map((v, i) => (
          <span key={i} className="text-[9px] text-neutral-600 text-right leading-none">
            {fmtAxis(v)}
          </span>
        ))}
      </div>

      {/* SVG */}
      <div className="ml-9">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-36 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLevels.map((v, i) => {
            const y = PAD_T + chartH - (v / maxVal) * chartH;
            return (
              <line
                key={i}
                x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                stroke="#27272a" strokeWidth="1"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots + hover areas */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Invisible wider hit area */}
              <rect
                x={p.x - 20} y={0} width={40} height={H}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              />
              {/* Dot */}
              <circle
                cx={p.x} cy={p.y} r={hovered === i ? 6 : 4}
                fill={p.amount > 0 ? '#f59e0b' : '#3f3f46'}
                stroke={hovered === i ? '#fff' : 'transparent'}
                strokeWidth="1.5"
                className="transition-all duration-150"
              />

              {/* Tooltip */}
              {hovered === i && (
                <g>
                  <rect
                    x={p.x - 52} y={p.y - 36}
                    width={104} height={28}
                    rx="6" ry="6"
                    fill="#1c1c1e"
                    stroke="#3f3f46"
                    strokeWidth="1"
                  />
                  <text
                    x={p.x} y={p.y - 26}
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {p.amount > 0 ? fmtAxis(p.amount) : 'No data'}
                  </text>
                  <text
                    x={p.x} y={p.y - 14}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="8"
                  >
                    {p.label}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-[11px] text-neutral-500 mt-1 px-0">
          {points.map((p, i) => (
            <span
              key={i}
              className={`transition-colors ${hovered === i ? 'text-amber-400 font-semibold' : ''}`}
              style={{ width: `${100 / points.length}%`, textAlign: 'center' }}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LineChartSection() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('loans')
      .select('amount, status, created_at')
      .in('status', ['active', 'completed']);

    if (err) {
      setError(err.message);
    } else {
      setLoans(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const chartData   = buildChartData(loans);
  const totalAmount = chartData.reduce((s, d) => s + d.amount, 0);
  const peakMonth   = chartData.reduce((a, b) => b.amount > a.amount ? b : a, chartData[0] || { label: '—', amount: 0 });
  const activeMonths = chartData.filter(d => d.amount > 0).length;

  return (
    <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-6 shadow-xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={15} className="text-amber-400" />
            Disbursement Trend
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Total disbursements over the last 6 months
          </p>
        </div>
        <button
          onClick={fetchLoans}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary pills */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-500">Total (6 months): </span>
            <span className="text-amber-400 font-bold">{fmt(totalAmount)}</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-500">Peak Month: </span>
            <span className="text-white font-semibold">{peakMonth.label} — {fmt(peakMonth.amount)}</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-500">Active Months: </span>
            <span className="text-emerald-400 font-semibold">{activeMonths}/6</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="h-48 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw size={20} className="text-amber-400 animate-spin" />
            <p className="text-xs text-zinc-500">Loading chart data...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={20} className="text-rose-400 mx-auto mb-2" />
            <p className="text-xs text-rose-400">{error}</p>
            <button onClick={fetchLoans} className="mt-2 text-xs text-zinc-400 hover:text-white cursor-pointer">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && <LineChart data={chartData} />}

      {/* No data hint */}
      {!loading && !error && totalAmount === 0 && (
        <p className="text-center text-xs text-zinc-600 mt-2">
          No disbursements recorded in the last 6 months yet.
        </p>
      )}
    </div>
  );
}
