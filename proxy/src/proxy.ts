import express from 'express'
import { createProxyMiddleware } from "http-proxy-middleware";
import { createClient } from "redis";

const TARGET = process.env.TARGET_API || "http://api-target:3000";

async function startProxy() {
    const redis = createClient({ url: "redis://redis:6379" });
    await redis.connect();
    const app = express();
    console.log("Connected to Redis");
    let rpsCounter = 0;
    setInterval(async () => { //get rps
        await redis.xAdd("rps_stream", "*", {
            rps: rpsCounter.toString(),
            timestamp: Date.now().toString(), //todo trim stream
        });
        console.log(`RPS: ${rpsCounter}`)
        rpsCounter = 0;
    }, 1000);

    app.use((req, res, next) => { //get log
        rpsCounter++;
        const start = Date.now();
        res.on("finish", async () => {
            const duration = Date.now() - start;
            await redis.xAdd("access_log_stream", "*", {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode.toString(),
                duration: duration.toString(),
                timestamp: Date.now().toString(),
            });
            const data = {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode.toString(),
                duration: duration.toString(),
                timestamp: Date.now().toString(),
            }
            console.log(`log: ${JSON.stringify(data)}`)
        });

        next();
    });

    app.use("/",
        createProxyMiddleware({
            target: TARGET,
            changeOrigin: true,
            logLevel: 'silent'
        })
    );

    app.listen(8081, () => {
        console.log(`Proxy running on port 8081 → proxying to ${TARGET}`);
    });
}
startProxy();
