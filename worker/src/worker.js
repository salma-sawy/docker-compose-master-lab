import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

await redis.connect();

console.log("Worker connected to Redis");

setInterval(async () => {
  const value = await redis.get("visits");

  console.log("Current visits:", value ?? 0);
}, 5000);