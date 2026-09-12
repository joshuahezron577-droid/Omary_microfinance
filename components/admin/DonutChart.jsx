'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, PieChart, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/superbase';

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUSES = [
  { key: 'pending',   label: 'Pending',   color: '#f59e0b', bg: 'bg-amber-400',   text: 'text-amber-400',   border: 'border-amber-400/30'   },
  { key: 'active',    label: 'Active',    color: '#60a5fa', bg: 'bg-blue-400',    text: 'text-blue-400',    border: 'border-blue-400/30'    },
  { key: 'completed', label: 'Completed', color: '#34d399', bg: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400/30' },
  { key: 'rejected',  label: 'Rejected',  color: '#f87171', bg: 'bg-rose-400',    text: 'text-rose-400',    border: 'border-rose-400/30'    },
];

// ─── SVG Donut ────────────────────────────────────────────────────────────────

function DonutSVG({ data, total }) {
  const [hovered, setHovered] = useState(null);
  const R = 70, cx = 90, cy = 90, strokeW = 22;
  const circumference = 2 * Math.PI * R;

  // Build segments
  let offset = 0;
  const segments = data
    .filter(d => d.count > 0)
    .map(d => {
      const pct  = d.count / total;
      const dash = pct * circumference;
      const gap  = circumference - dash;
      const seg  = { ...d, dash, gap, offset, pct };
      offset += dash;
      return seg;
    });

  // Rotation starts from top (-90deg)
  let rotation = -90;
  const arcs = segments.map(seg => {
    const arc = { ...seg, rotation };
    rotation += seg.pct * 360;
    return arc;
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background ring */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeW}
        />

        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={arc.key}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={hovered === i ? strokeW + 4 : strokeW}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(${arc.rotation} ${cx} ${cy})`}
            strokeLinecap="butt"
            className="transition-all duration-200 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}

        {/* Center text */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold">
          {hovered !== null ? arcs[hovered]?.count : total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#a1a1aa" fontSize="10">
          {hovered !== null ? arcs[hovered]?.label : 'Total Loans'}
        </text>
        {hovered !== null && (
          <text x={cx} y={cy + 26} textAnchor="middle" fill={arcs[hovered]?.color} fontSize="10" fontWeight="bold">
            {Math.round(arcs[hovered]?.pct * 100)}%
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DonutChart() {
  const [counts, setCounts] = useState({ pending: 0, active: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('loans')
      .select('status');

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const c = { pending: 0, active: 0, completed: 0, rejected: 0 };
    (data || []).forEach(l => {
      if (c[l.status] !== undefined) c[l.status]++;
    });
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const chartData = STATUSES.map(s => ({ ...s, count: counts[s.key] }));
  const total     = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-6 shadow-xl flex flex-col">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart size={15} className="text-amber-400" />
            Loan Status
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Mgawanyo wa mikopo kwa hali
          </p>
        </div>
        <button
          onClick={fetchCounts}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center h-48">
          <RefreshCw size={20} className="text-amber-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center h-48 text-center">
          <div>
            <AlertTriangle size={20} className="text-rose-400 mx-auto mb-2" />
            <p className="text-xs text-rose-400">{error}</p>
            <button onClick={fetchCounts} className="mt-2 text-xs text-zinc-400 hover:text-white cursor-pointer">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Chart + Legend */}
      {!loading && !error && (
        <div className="flex flex-col items-center gap-5">

          {/* Donut */}
          {total === 0 ? (
            <div className="h-44 flex items-center justify-center">
              <p className="text-xs text-zinc-600">Hakuna mikopo bado.</p>
            </div>
          ) : (
            <DonutSVG data={chartData} total={total} />
          )}

          {/* Legend */}
          <div className="w-full grid grid-cols-2 gap-2">
            {chartData.map(s => (
              <div
                key={s.key}
                className={`flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 border ${s.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.bg} shrink-0`} />
                  <span className="text-[11px] text-zinc-400">{s.label}</span>
                </div>
                <span className={`text-sm font-bold ${s.text}`}>{s.count}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
