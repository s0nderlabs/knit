import { Hono } from "hono";
import type { AppContext } from "../types";

const health = new Hono<AppContext>();

health.get("/", (c) =>
  c.json({
    status: "ok",
    service: "knit-backend",
    version: "0.1.0",
  })
);

export default health;
