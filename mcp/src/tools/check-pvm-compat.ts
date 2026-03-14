import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkPvmCompatibility } from "../core/compat-checker.js";

const CheckPvmCompatSchema = z.object({
  source: z
    .string()
    .describe(
      "Solidity source code to analyze for PVM compatibility issues. Pass the full contract source."
    ),
});

export function registerCheckPvmCompat(server: McpServer): void {
  server.tool(
    "check_pvm_compat",
    "Analyze Solidity source code for PVM (PolkaVM) compatibility issues. Detects unsupported opcodes (pc, extcodecopy, selfdestruct), dangerous patterns (send/transfer without reentrancy guard), and estimates bytecode size risk. Run this BEFORE compile_pvm.",
    CheckPvmCompatSchema.shape,
    async (params): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
      const input = params as z.infer<typeof CheckPvmCompatSchema>;
      const result = checkPvmCompatibility(input.source);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
