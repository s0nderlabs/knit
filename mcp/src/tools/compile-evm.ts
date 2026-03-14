import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compileEvm, type SolcOutput } from "../core/solc.js";

const CompileEvmSchema = z.object({
  sources: z
    .record(z.string())
    .describe(
      "Map of filename to Solidity source code. Example: { 'MyToken.sol': 'pragma solidity ^0.8.20; ...' }"
    ),
  contractName: z
    .string()
    .describe("Name of the contract to compile (e.g., 'MyToken')"),
  evmVersion: z
    .string()
    .optional()
    .describe("EVM version target (default: 'paris'). Use 'paris' for Polkadot Hub."),
  optimizerRuns: z
    .number()
    .optional()
    .describe("Optimizer runs (default: 200)"),
});

export function registerCompileEvm(server: McpServer): void {
  server.tool(
    "compile_evm",
    "Compile Solidity source code to EVM bytecode using solc. Returns ABI and bytecode. Use for any EVM-compatible chain deployment.",
    CompileEvmSchema.shape,
    async (params): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
      const input = params as z.infer<typeof CompileEvmSchema>;
      const result = compileEvm({
        sources: input.sources,
        contractName: input.contractName,
        evmVersion: input.evmVersion,
        optimizerRuns: input.optimizerRuns,
      });

      const response: Record<string, unknown> = {
        success: result.success,
      };

      if (result.success) {
        response.contractName = input.contractName;
        response.abi = result.abi;
        response.bytecode = result.bytecode;
        response.bytecodeSize = result.bytecode
          ? Math.floor((result.bytecode.length - 2) / 2)
          : 0;
      }

      if (result.errors && result.errors.length > 0) {
        response.errors = result.errors;
      }
      if (result.warnings && result.warnings.length > 0) {
        response.warnings = result.warnings;
      }

      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
  );
}
