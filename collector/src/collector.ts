import si from "systeminformation";
import { createClient } from "redis";
import {redis} from './redis'
import fs from "fs";
import { loadEnvFile } from "process";

function parseNetDev() {
  const data = fs.readFileSync("/proc/net/dev", "utf8");
  const lines = data.split("\n").slice(2);

  let totalRx = 0, totalTx = 0;

  for (let l of lines) {
    if (!l.trim()) continue;
    const [iface, rest] = l.split(":");
    const stats = rest.trim().split(/\s+/);

    totalRx += parseInt(stats[0]);   
    totalTx += parseInt(stats[8]);   
  }

  return { totalRx, totalTx };
}

//let prev = parseNetDev();
async function main() {
    setInterval(async () => {
        const timestamp = Date.now().toString();

        const cpuLoad = await si.currentLoad();
        const cpuPercent = cpuLoad.currentLoad.toFixed(2);
        const mem = await si.mem();
        const memUsedPercent = ((1 - mem.available / mem.total) * 100).toFixed(2);
        const disk = await si.fsSize();
        const diskUsage = disk.find(d => d.mount === "/hostfs");
        await redis.xAdd("load_stream", "*", {
            cpu: cpuPercent,
            mem: memUsedPercent,
            timestamp: timestamp,
        }, {
            TRIM: { strategy: 'MINID', threshold: Date.now() - 5 * 60 * 1000 }
        });
        console.log("tes")
        await redis.xAdd("disk_usage", "*", {
            total: (diskUsage?.size || 0).toString(),
            used: (diskUsage?.used || 0).toString(),
            free: (diskUsage?.available || 0).toString(),
            timestamp: timestamp,
        }, {
            TRIM: { strategy: 'MINID', threshold: Date.now() - 5 * 60 * 1000 }
        });
        /*
        let curr = parseNetDev()
        await redis.xAdd("network", "", {
            rx: (curr.totalRx - prev.totalRx).toString(),
            tx: (curr.totalTx - prev.totalTx).toString()
        })
        prev = curr
        */
    }, 1000);
}

main();
