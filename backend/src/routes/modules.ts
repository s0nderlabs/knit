import { Hono } from "hono";
import type { AppContext } from "../types";
import {
  OZ_MODULES,
  PRECOMPILE_MODULES,
  ALL_MODULES,
} from "../config/modules";

const modules = new Hono<AppContext>();

// GET /api/modules
modules.get("/api/modules", (c) => {
  const category = c.req.query("category");

  if (category === "openzeppelin") return c.json(OZ_MODULES);
  if (category === "polkadot-precompile") return c.json(PRECOMPILE_MODULES);

  return c.json(ALL_MODULES);
});

// GET /api/precompiles
modules.get("/api/precompiles", (c) => {
  return c.json(
    PRECOMPILE_MODULES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      source: p.source,
    }))
  );
});

export default modules;
