import { useEffect, useState, useRef } from "react";
import type { LogEntry, ChartData, DockerStats } from "./types";
import RpsChart from "./components/RpsChart";
import SystemLoadChart from "./components/SystemLoadChart";
import AccessLogViewer from "./components/AccessLogViewer";
import DockerStatsViewer from "./components/DockerStatsViewer";

// Helper constants
const MAX_HISTORY_POINTS = 120; // 2 minutes if 1 update/sec

export default function App() {
  // --- States ---
  
  // RPS
  const [currentRps, setCurrentRps] = useState(0);
  const [rpsHistory, setRpsHistory] = useState<ChartData[]>([]);

  // System Load
  const [cpu, setCpu] = useState(0);
  const [mem, setMem] = useState(0);
  const [loadHistory, setLoadHistory] = useState<ChartData[]>([]);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Docker
  // Menyimpan history per nama container
  const [dockerHistories, setDockerHistories] = useState<Record<string, ChartData[]>>({});
  // Menyimpan stats realtime terakhir untuk display angka
  const [dockerCurrentStats, setDockerCurrentStats] = useState<Record<string, {cpu: string, mem: string}>>({});

  // WebSocket Logic
  useEffect(() => {
    const ws = new WebSocket("ws://host.docker.internal:8080");

    const updateHistory = (prev: ChartData[], newVal: number, newVal2?: number) => {
        const now = new Date().toLocaleTimeString();
        const newEntry: ChartData = { time: now, value: newVal, value2: newVal2 };
        const updated = [...prev, newEntry];
        if (updated.length > MAX_HISTORY_POINTS) {
            return updated.slice(updated.length - MAX_HISTORY_POINTS);
        }
        return updated;
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        // 1. RPS Stream
        if (data.stream === "rps_stream") {
          const rpsVal = Number(data.payload.rps);
          setCurrentRps(rpsVal);
          setRpsHistory((prev) => updateHistory(prev, rpsVal));
        }

        // 2. Access Log Stream
        if (data.stream === "access_log_stream") {
          setLogs((prev) => [...prev.slice(-100), data.payload]); // Keep last 100 logs
        }

        // 3. Load Stream
        if (data.stream === "load_stream") {
          const cpuVal = Number(data.payload.cpu);
          const memVal = Number(data.payload.mem);
          setCpu(cpuVal);
          setMem(memVal);
          setLoadHistory((prev) => updateHistory(prev, cpuVal, memVal));
        }

        // 4. Docker Stats Stream
        if (data.stream === "docker_stats_stream") {
          const payload: DockerStats = data.payload;
          
          // Parsing percentages from strings like "0.5%" to numbers
          const cpuNum = parseFloat(payload.cpu.replace('%', ''));
          const memNum = parseFloat(payload.memPercent.replace('%', ''));
          
          setDockerCurrentStats(prev => ({
            ...prev,
            [payload.name]: { cpu: payload.cpu, mem: payload.memPercent }
          }));

          setDockerHistories(prev => {
            const containerHistory = prev[payload.name] || [];
            const now = new Date().toLocaleTimeString();
            
            // Add new point
            const newHistory = [...containerHistory, { time: now, value: cpuNum, value2: memNum }];
            
            // Trim history
            if (newHistory.length > MAX_HISTORY_POINTS) {
                newHistory.shift(); 
            }

            return {
                ...prev,
                [payload.name]: newHistory
            };
          });
        }
      } catch (e) {
        console.error("Parse error", e);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6 font-sans selection:bg-zinc-700">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Server Monitor</h1>
        <p className="text-zinc-500 text-sm">Real-time telemetry dashboard</p>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
        
        {/* Row 1: RPS & Load */}
        <div className="col-span-1 h-[350px]">
             <RpsChart data={rpsHistory} currentRps={currentRps} />
        </div>
        <div className="col-span-1 lg:col-span-2 h-[350px]">
             <SystemLoadChart data={loadHistory} currentCpu={cpu} currentMem={mem} />
        </div>

        {/* Row 2: Docker & Logs */}
        <div className="col-span-1 h-[400px]">
             <DockerStatsViewer 
                dockerHistories={dockerHistories} 
                currentStats={dockerCurrentStats} 
             />
        </div>
        <div className="col-span-1 lg:col-span-2 h-[400px]">
            <AccessLogViewer logs={logs} />
        </div>
        
      </div>
    </div>
  );
}