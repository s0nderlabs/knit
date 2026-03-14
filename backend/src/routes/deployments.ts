import { Hono } from "hono";
import type { AppContext } from "../types";
import { getDeploymentsByDeployer } from "../services/registry";
import type { Hex } from "viem";

const deployments = new Hono<AppContext>();

// GET /api/deployments/:address
deployments.get("/api/deployments/:address", async (c) => {
  const address = c.req.param("address");

  // Try both EVM and PVM registries
  const results: { target: string; contracts: string[] }[] = [];

  for (const target of ["evm", "pvm"] as const) {
    try {
      const contracts = await getDeploymentsByDeployer(
        address as Hex,
        target
      );
      if (contracts && (contracts as string[]).length > 0) {
        results.push({ target, contracts: contracts as string[] });
      }
    } catch {
      // Registry might not be deployed yet
    }
  }

  return c.json({ address, deployments: results });
});

export default deployments;
