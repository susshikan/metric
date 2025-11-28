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

const prevStats = new Map<string, any>();

async function collectDocker() {
  try {
    const { data: containers } = await docker.get("/containers/json");
    console.log(containers)
    for (const c of containers) {
      const { data: curr } = await docker.get(`/containers/${c.Id}/stats?stream=false`);
      console.log(curr)
      const prev = prevStats.get(c.Id);

      const cpu = calcCPU(curr, prev);
      const mem = parseMem(curr);

      await redis.xAdd("docker_stats_stream", "*", {
        id: c.Id.slice(0, 12),
        name: c.Names?.[0]?.replace("/", "") || "unknown",
        image: c.Image,
        cpu: cpu.toFixed(2),
        memUsed: mem.used.toString(),
        memLimit: mem.limit.toString(),
        memPercent: mem.percent.toString(),
        timestamp: Date.now().toString()
      });

      prevStats.set(c.Id, curr);
    }
  } catch (err: any) {
    console.error("[dockerCollector]", err.message || err);
  }
}

setInterval(collectDocker, 2000);
