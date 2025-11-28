import React, { useState, useMemo } from "react";
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import type { ChartData } from "../types";
import { Box, Server } from "lucide-react";

interface DockerStatsViewerProps {
  // Key adalah nama container, Value adalah array history chart
  dockerHistories: Record<string, ChartData[]>;
  currentStats: Record<string, { cpu: string, mem: string }>;
}

export default function DockerStatsViewer({ dockerHistories, currentStats }: DockerStatsViewerProps) {
  const containerNames = Object.keys(dockerHistories);
  const [selectedContainer, setSelectedContainer] = useState<string>(containerNames[0] || "");

  // Update selected container automatically if none selected initially and data comes in
  React.useEffect(() => {
    if (!selectedContainer && containerNames.length > 0) {
      setSelectedContainer(containerNames[0]);
    }
  }, [containerNames, selectedContainer]);

  const activeData = dockerHistories[selectedContainer] || [];
  const activeStats = currentStats[selectedContainer] || { cpu: "0%", mem: "0%" };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-zinc-400" />
          <h2 className="text-zinc-100 font-semibold text-lg">Container Metrics</h2>
        </div>
        
        {containerNames.length > 0 ? (
            <select
            className="bg-zinc-800 text-zinc-300 text-sm border border-zinc-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-zinc-500 max-w-[200px]"
            value={selectedContainer}
            onChange={(e) => setSelectedContainer(e.target.value)}
            >
            {containerNames.map(name => (
                <option key={name} value={name}>{name}</option>
            ))}
            </select>
        ) : (
            <span className="text-zinc-600 text-sm">Waiting for Docker streams...</span>
        )}
      </div>

      {selectedContainer && (
        <div className="flex flex-col gap-4 flex-1">
             {/* Stats Header */}
             <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">CPU Usage</p>
                    <p className="text-white font-mono text-xl">{activeStats.cpu}</p>
                </div>
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">Mem Usage</p>
                    <p className="text-white font-mono text-xl">{activeStats.mem}</p>
                </div>
             </div>

             {/* Chart */}
             <div className="flex-1 min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeData}>
                    <defs>
                    <linearGradient id="colorDocker" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <YAxis hide domain={[0, 'auto']} /> 
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                    <Area
                    type="step"
                    dataKey="value" // CPU data mapped here
                    name="CPU"
                    stroke="#a1a1aa"
                    strokeWidth={2}
                    fill="url(#colorDocker)"
                    isAnimationActive={false}
                    />
                    <Area
                    type="step"
                    dataKey="value2" // Mem data mapped here
                    name="Mem"
                    stroke="#52525b"
                    strokeWidth={2}
                    fill="transparent"
                    isAnimationActive={false}
                    />
                </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>
      )}
    </div>
  );
}