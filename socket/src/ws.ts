import { WebSocketServer } from "ws";
import { createClient } from "redis";

async function start() {
  const wss = new WebSocketServer({ port: 8080 });
  const redis = createClient({ url: "redis://redis:6379" });
  await redis.connect();

  console.log("WS server running on :8080");

  const streams = [
    { key: "rps_stream", id: "$" },
    { key: "access_log_stream", id: "$" }
  ];

  while (true) {
    const reply = await redis.xRead(streams, { BLOCK: 0 });

    if (reply) {
      const stream = reply[0];
      const { name, messages } = stream;

      messages.forEach((msg) => {
        const json = {
          stream: name,
          id: msg.id,
          payload: msg.message,
        };
        wss.clients.forEach(c => c.send(JSON.stringify(json)));
      });
    }
  }
}

start();
