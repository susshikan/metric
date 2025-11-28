import si from "systeminformation";
import { createClient } from "redis";
import {redis} from './redis'

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
    }, 1000);
}

main();
