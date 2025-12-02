import { LineChart, Line, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ChartData } from "../types";
import { Cpu } from "lucide-react";

interface SystemLoadChartProps {
  data: ChartData[];
  currentCpu: number;
  currentMem: number;
}

export default function SystemLoadChart({ data, currentCpu, currentMem }: SystemLoadChartProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-zinc-400" />
          <h2 className="text-zinc-100 font-semibold text-lg">System Load</h2>
        </div>
        <div className="flex gap-4 text-sm">
            <span className="text-zinc-400">CPU: <span className="text-white font-mono">{currentCpu.toFixed(1)}%</span></span>
            <span className="text-zinc-400">MEM: <span className="text-white font-mono">{currentMem.toFixed(1)}%</span></span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <YAxis domain={[0, 100]} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            <Line 
                type="monotone" 
                dataKey="value" 
                name="CPU %" 
                stroke="#fff" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
            />
            <Line 
                type="monotone" 
                dataKey="value2" 
                name="Memory %" 
                stroke="#52525b" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false} 
                isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}