import { Hono } from "hono";
import { z } from "zod";
import type { AppContext, DeployResponse } from "../types";
import { deployEvm } from "../services/deployer";
import { buildDeploymentMerkle, hashString } from "../services/merkle";
import { registerDeployment } from "../services/registry";
import { isPolkadotHub } from "../config/chains";
import type { Hex } from "viem";

const deploy = new Hono<AppContext>();

const DeployBody = z.object({
  bytecode: z.string(),
  abi: z.array(z.any()),
  constructorArgs: z.array(z.any()).default([]),
  chainId: z.number(),
  target: z.enum(["evm", "pvm"]),
  deployer: z.string(),
  model: z.string().default("claude-sonnet-4-20250514"),
  modules: z.array(z.string()).default([]),
  source: z.string().optional(),
});

// POST /api/deploy
deploy.post("/api/deploy", async (c) => {
  const body = await c.req.json();
  const parsed = DeployBody.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.message } as any,
      400
    );
  }

  const { bytecode, abi, constructorArgs, chainId, target, deployer, model, modules, source } =
    parsed.data;

  // Deploy the contract
  let result;
  if (target === "evm") {
    result = await deployEvm({
      bytecode: bytecode as Hex,
      abi,
      constructorArgs,
      chainId,
      deployer,
    });
  } else {
    return c.json(
      { success: false, error: "PVM deployment not yet supported" } as any,
      501
    );
  }

  // Stamp in registry (Polkadot Hub only)
  let registryTxHash: string | undefined;
  if (isPolkadotHub(chainId)) {
    try {
      const sourceHash = source ? hashString(source) : hashString(bytecode);
      const { root } = buildDeploymentMerkle({
        modules,
        sourceHash,
        model,
        deployer,
      });

      registryTxHash = await registerDeployment({
        contractAddress: result.contractAddress as Hex,
        deployer: deployer as Hex,
        model,
        merkleRoot: root as Hex,
        target,
      });
    } catch (err: any) {
      // Registry stamp is best-effort — don't fail the deploy
      console.error("Registry stamp failed:", err.message);
    }
  }

  const response: DeployResponse = {
    success: true,
    contractAddress: result.contractAddress,
    txHash: result.txHash,
    registryTxHash,
    explorerUrl: result.explorerUrl,
  };

  return c.json(response);
});

export default deploy;
