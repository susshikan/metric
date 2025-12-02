import  { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ChartData } from "../types";
import { Activity } from "lucide-react";

interface RpsChartProps {
  data: ChartData[];
  currentRps: number;
}

export default function RpsChart({ data, currentRps }: RpsChartProps) {
  const [maxY, setMaxY] = useState(100);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-zinc-400" />
          <h2 className="text-zinc-100 font-semibold text-lg">Requests / Second</h2>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">{currentRps}</span>
            <select
            className="bg-zinc-800 text-zinc-300 text-sm border border-zinc-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-zinc-500"
            value={maxY}
            onChange={(e) => setMaxY(Number(e.target.value))}
            >
            <option value={100}>Max: 100</option>
            <option value={500}>Max: 500</option>
            <option value={1000}>Max: 1000</option>
            </select>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f4f4f5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f4f4f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, maxY]} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#e4e4e7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRps)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-zinc-500 mt-2 text-center">Last 2 Minutes History</p>
    </div>
  );
}