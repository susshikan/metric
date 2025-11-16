import { WebSocketServer } from "ws";
import { createClient } from "redis";

type RpsPayload = {
  id: string
  rps: string;
  timestamp: string;
};

type AccessLogPayload = {
  id: string
  method: string;
  url: string;
  status: string;
  duration: string;
  timestamp: string;
};

type SocketReply = | { stream: "rps_stream"; payload: RpsPayload } | { stream: "access_log_stream"; payload: AccessLogPayload };



async function start() {
  const wss = new WebSocketServer({ port: 8080 });
  const redis = createClient({ url: "redis://redis:6379" });
  await redis.connect();

  console.log("WS server running on :8080");

  const streams = [
    { key: "rps_stream", id: "$" },
    { key: "access_log_stream", id: "$" },
    { key: "load_stream", id: "$"}
  ];

  while (true) {
    const reply: any = await redis.xRead(streams, { BLOCK: 0 });

    if (!reply || reply.length === 0) {
      continue
    }
    const stream = reply[0];
    const { name, messages } = stream;
    messages.forEach((msg: any) => {
      const json = {
        stream: name,
        id: msg.id,
        payload: msg.message,
      };
      console.log(json)
      wss.clients.forEach(c => c.send(JSON.stringify(json)));
    });
  }
}

start();
