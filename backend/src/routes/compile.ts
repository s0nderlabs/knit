import { Hono } from "hono";
import { z } from "zod";
import type { AppContext } from "../types";
import { compileEvm, compilePvm } from "../services/compiler";

const compile = new Hono<AppContext>();

const CompileBody = z.object({
  sources: z.record(z.string()),
  contractName: z.string(),
});

// POST /api/compile/evm
compile.post("/api/compile/evm", async (c) => {
  const body = await c.req.json();
  const parsed = CompileBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, errors: [{ severity: "error", message: parsed.error.message }] }, 400);
  }

  const result = await compileEvm(parsed.data.sources, parsed.data.contractName);
  return c.json(result, result.success ? 200 : 422);
});

// POST /api/compile/pvm
compile.post("/api/compile/pvm", async (c) => {
  const body = await c.req.json();
  const parsed = CompileBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, errors: [{ severity: "error", message: parsed.error.message }] }, 400);
  }

  const result = await compilePvm(parsed.data.sources, parsed.data.contractName);
  return c.json(result, result.success ? 200 : 422);
});

export default compile;
