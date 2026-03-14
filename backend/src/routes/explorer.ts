import { Hono } from "hono";
import type { AppContext } from "../types";
import { fetchContractSource } from "../services/explorer";

const explorer = new Hono<AppContext>();

// GET /api/explorer/:chain/:address
explorer.get("/api/explorer/:chain/:address", async (c) => {
  const chain = c.req.param("chain");
  const address = c.req.param("address");

  const chainId = parseInt(chain, 10);
  if (isNaN(chainId)) {
    return c.json({ error: "Invalid chain ID" }, 400);
  }

  const contract = await fetchContractSource(chainId, address);
  if (!contract) {
    return c.json({ error: "Contract not found or not verified" }, 404);
  }

  return c.json(contract);
});

export default explorer;
