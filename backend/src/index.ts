import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppContext } from "./types";
import health from "./routes/health";
import chat from "./routes/chat";
import compile from "./routes/compile";
import deploy from "./routes/deploy";
import explorer from "./routes/explorer";
import modules from "./routes/modules";
import deployments from "./routes/deployments";

const app = new Hono<AppContext>();
const isProduction = process.env.NODE_ENV === "production";

// CORS
app.use("/*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3002",
}));

// Error handler
app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}:`, err.message);
  return c.json({ error: isProduction ? "Internal server error" : err.message }, 500);
});

// Mount routes
app.route("/", health);
app.route("/", chat);
app.route("/", compile);
app.route("/", deploy);
app.route("/", explorer);
app.route("/", modules);
app.route("/", deployments);

// Start server
const port = parseInt(process.env.PORT || "3001", 10);

export default {
  fetch: app.fetch,
  port,
  idleTimeout: 255,
};

console.log(`Knit backend running on http://localhost:${port}`);
