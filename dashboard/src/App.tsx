import { useEffect, useState } from "react";

interface LogEntry {
  method: string;
  url: string;
  status: string;
  duration: string;
  timestamp: string;
}

interface dockerEntry {
  id: string;
  name: string;
  image: string;
  cpu: string;
  memUsed: string;
  memLimit: string;
  memPercent: string;
  timestamp: string;
}

export default function App() {
  const [rps, setRps] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cpu, setCpu] = useState(0);
  const [mem, setMem] = useState(0);
  const [docker, setDocker] = useState<dockerEntry[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://host.docker.internal:8080");

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.stream === "rps_stream") {
        setRps(Number(data.payload.rps));
      }

      if (data.stream === "access_log_stream") {
        setLogs((prev) => [...prev.slice(-30), data.payload]);
      }

      if (data.stream === "load_stream") {
        setCpu(Number(data.payload.cpu));
        setMem(Number(data.payload.mem));
      }

      if (data.stream == "docker_stats_stream") {
        setDocker(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Server Load Visualizer</h1>

      {/* RPS */}
      <h2>RPS: {rps}</h2>

      {/* CPU & Memory */}
      <div style={{ marginTop: 20 }}>
        <h2>CPU Usage: {cpu.toFixed(2)}%</h2>
        <h2>Memory Usage: {mem.toFixed(2)}%</h2>
      </div>

      {/* Recent Logs */}
      <h3 style={{ marginTop: 40 }}>Recent Logs</h3>
      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 10,
        }}
      >
        {logs.map((l, i) => (
          <div key={i}>
            [{l.timestamp}] {l.method} {l.url} → {l.status} ({l.duration}ms)
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 40 }}>Docker stats</h3>
      {docker.map(data => (
        <div style={{
          border: 5,
          margin: 5
        }}>
          <h2>{data.name}</h2>
          <h3>Mem: {data.memPercent}</h3>
        </div>
      ))}
    </div>
  );
}
