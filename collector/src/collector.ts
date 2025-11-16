import os from "os-utils";
import { createClient } from "redis";

async function main() {
    const redis = createClient({ url: "redis://redis:6379" });
    await redis.connect();
    setInterval(() => {
        os.cpuUsage(async (cpu) => { //get cpu trus kirim ke redis per 1 detik
            await redis.xAdd("load_stream", "*", {
                cpu: (cpu * 100).toFixed(2),
                mem: (100 - os.freememPercentage() * 100).toFixed(2),
                timestamp: Date.now().toString(),
            });
        });
    }, 1000);
}

main();
