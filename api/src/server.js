import express from "express";
import pg from "pg";
import { createClient } from "redis";
import fs from "node:fs";

const { Pool } = pg;

const app = express();

const PORT = process.env.PORT || 3000;
const dbPassword = fs
  .readFileSync(process.env.DB_PASSWORD_FILE, "utf8")
  .trim();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: dbPassword
});

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

app.get("/", async (req, res) => {
  res.json({
    message: "Docker Compose Master Lab",
    hostname: process.env.HOSTNAME,
    environment: process.env.NODE_ENV
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    await redis.ping();

    res.json({
      status: "healthy",
      postgres: "ok",
      redis: "ok"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

app.get("/users", async (req, res) => {
  const result = await pool.query(
    "SELECT id, name FROM users ORDER BY id"
  );

  res.json(result.rows);
});

app.get("/cache", async (req, res) => {
  const visits = await redis.incr("visits");

  res.json({
    visits
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${PORT}`);
});