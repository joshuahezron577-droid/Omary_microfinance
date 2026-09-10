import React from 'react';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi';

export default function StatsCard({ title, value, change, isPositive, icon: Icon }) {
  return (
    <div className="bg-[#121212] border-2 border-zinc-800 p-5 rounded-2xl shadow-lg hover:border-emerald-400 hover:border-t-emerald-300 hover:shadow-emerald-400/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-default flex flex-col justify-between">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-sm font-medium">{title}</span>
        {Icon && (
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-emerald-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        <div className="flex items-center mt-2 space-x-1">
          <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'}`}>
            {isPositive ? <HiArrowUp className="w-3 h-3 mr-0.5" /> : <HiArrowDown className="w-3 h-3 mr-0.5" />}
            {change}
          </span>
          <span className="text-[11px] text-zinc-500">vs last month</span>
        </div>
      </div>
    </div>
  );
}