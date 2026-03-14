import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compilePvm } from "../core/resolc.js";

const CompilePvmSchema = z.object({
  sources: z
    .record(z.string())
    .describe(
      "Map of filename to Solidity source code. Example: { 'MyToken.sol': 'pragma solidity ^0.8.20; ...' }"
    ),
  contractName: z
    .string()
    .describe("Name of the contract to compile (e.g., 'MyToken')"),
});

export function registerCompilePvm(server: McpServer): void {
  server.tool(
    "compile_pvm",
    "Compile Solidity to PVM (PolkaVM) bytecode using resolc. Required for deploying to Polkadot Hub's PVM. Returns ABI and PVM blob. Note: PVM bytecode is 10-20x larger than EVM — check compatibility first with check_pvm_compat.",
    CompilePvmSchema.shape,
    async (params): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
      const input = params as z.infer<typeof CompilePvmSchema>;

      try {
        const result = await compilePvm({
          sources: input.sources,
          contractName: input.contractName,
        });

        const response: Record<string, unknown> = {
          success: result.success,
        };

        if (result.success) {
          response.contractName = input.contractName;
          response.abi = result.abi;
          response.pvmBytecode = result.pvmBytecode;
          response.pvmBytecodeSize = result.pvmBytecode
            ? Math.floor((result.pvmBytecode.length - 2) / 2)
            : 0;

          // Warn about 48KB limit
          const sizeBytes = response.pvmBytecodeSize as number;
          if (sizeBytes > 48 * 1024) {
            response.sizeWarning = `PVM bytecode is ${(sizeBytes / 1024).toFixed(1)}KB — exceeds the 48KB initcode limit. Split into smaller contracts.`;
          } else if (sizeBytes > 32 * 1024) {
            response.sizeWarning = `PVM bytecode is ${(sizeBytes / 1024).toFixed(1)}KB — approaching the 48KB initcode limit. Consider splitting.`;
          }
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
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Unknown resolc compilation error",
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
