import { createClient } from "redis";

export const redis = createClient({url: "redis://redis:6379"})

export async function initRedis(){
    if(!redis.isOpen) await redis.connect()
}