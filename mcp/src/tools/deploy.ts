import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deployContract, deployPvmContract } from "../core/deployer.js";

const DeploySchema = z.object({
  bytecode: z
    .string()
    .describe("Contract bytecode (hex string with 0x prefix) from compile_evm or compile_pvm"),
  abi: z
    .array(z.any())
    .describe("Contract ABI from compilation"),
  constructorArgs: z
    .array(z.any())
    .optional()
    .describe("Constructor arguments (if any). Must match the constructor signature."),
  rpcUrl: z
    .string()
    .describe(
      "RPC URL for the target chain. Polkadot Hub testnet: https://services.polkadothub-rpc.com/testnet"
    ),
  chainId: z
    .number()
    .describe("Chain ID. Polkadot Hub testnet: 420420417, mainnet: 420420419"),
  target: z
    .enum(["evm", "pvm"])
    .describe("Deployment target: 'evm' for standard EVM deployment, 'pvm' for PolkaVM deployment"),
});

export function registerDeploy(server: McpServer): void {
  server.tool(
    "deploy",
    "Deploy a compiled smart contract to an EVM-compatible chain or Polkadot Hub PVM. For EVM: single transaction via viem. For PVM: two-step upload + instantiate (requires Hardhat plugin).",
    DeploySchema.shape,
    async (params): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
      const input = params as z.infer<typeof DeploySchema>;

      const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
      if (!privateKey) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "DEPLOYER_PRIVATE_KEY not set in environment" }, null, 2) }],
        };
      }

      if (input.target === "pvm") {
        const result = await deployPvmContract({
          pvmBytecode: input.bytecode,
          abi: input.abi,
          constructorArgs: input.constructorArgs,
          rpcUrl: input.rpcUrl,
          chainId: input.chainId,
          privateKey,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      const result = await deployContract({
        bytecode: input.bytecode,
        abi: input.abi,
        constructorArgs: input.constructorArgs,
        rpcUrl: input.rpcUrl,
        chainId: input.chainId,
        privateKey,
      });

      // Add explorer URL if Polkadot Hub
      const response: Record<string, unknown> = { ...result };
      if (result.success && result.contractAddress) {
        if (input.chainId === 420420417) {
          response.explorerUrl = `https://blockscout-testnet.polkadot.io/address/${result.contractAddress}`;
        } else if (input.chainId === 420420419) {
          response.explorerUrl = `https://blockscout.polkadot.io/address/${result.contractAddress}`;
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
  );
}
