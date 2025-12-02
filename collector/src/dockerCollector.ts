import axios from "axios";
import { redis } from "./redis";

const docker = axios.create({
  socketPath: "/var/run/docker.sock",
  baseURL: "http://localhost",
  timeout: 5000
});

function calcCPU(curr: any, prev: any): number {
  if (!prev) return 0;

  const cpuDelta =
    curr.cpu_stats.cpu_usage.total_usage -
    prev.cpu_stats.cpu_usage.total_usage;

  const systemDelta =
    curr.cpu_stats.system_cpu_usage -
    prev.cpu_stats.system_cpu_usage;

  const cores = curr.cpu_stats.online_cpus || 1;

  if (systemDelta <= 0 || cpuDelta <= 0) return 0;
  return (cpuDelta / systemDelta) * cores * 100;
}

function parseMem(stat: any) {
  const used = stat.memory_stats.usage || 0;
  const limit = stat.memory_stats.limit || 1;

  return {
    used: Math.round(used / 1024 / 1024),
    limit: Math.round(limit / 1024 / 1024),
    percent: Number(((used / limit) * 100).toFixed(2))
  };
}

function calcNetwork(curr: any, prev: any) {
  let rx = 0;
  let tx = 0;
  for (const iface of Object.values(curr.networks || {}) as Array<{ rx_bytes?: number; tx_bytes?: number }>) {
    rx += iface.rx_bytes || 0;
    tx += iface.tx_bytes || 0;
  }
  if (!prev?.net) return { rx: 0, tx: 0 };
  return {
    rx: rx - prev.net.rx,
    tx: tx - prev.net.tx
  };
}


const prevStats = new Map<string, any>();

async function collectDocker() {
  try {
    const { data: containers } = await docker.get("/containers/json");

    for (const c of containers) {
      const { data: curr } = await docker.get(`/containers/${c.Id}/stats?stream=false`);
      const prev = prevStats.get(c.Id);
      const { data: info } = await docker.get(`/containers/${c.Id}/json`);


      const cpu = calcCPU(curr, prev);
      const mem = parseMem(curr);
      const restartCount = info.State.RestartCount;
      const startedAt = new Date(info.State.StartedAt).getTime();
      const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
      const net = calcNetwork(curr, prev);

      await redis.xAdd("docker_stats_stream", "*", {
        id: c.Id.slice(0, 12),
        name: c.Names?.[0]?.replace("/", "") || "unknown",
        image: c.Image,
        cpu: cpu.toFixed(2),
        memUsed: mem.used.toString(),
        memLimit: mem.limit.toString(),
        memPercent: mem.percent.toString(),
        uptime: uptimeSec.toString(),
        restartCount: restartCount.toString(),
        status: info.State.Status,
        rx: net.rx.toString(),
        tx: net.tx.toString(),
        timestamp: Date.now().toString()
      }, {
        TRIM: { strategy: "MAXLEN", threshold: 1000 }
      });

      prevStats.set(c.Id, curr);
    }
  } catch (err: any) {
    console.error("[dockerCollector]", err.message || err);
  }
}

setInterval(collectDocker, 2000);
