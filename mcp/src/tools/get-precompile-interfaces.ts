import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPrecompile, listPrecompiles, PRECOMPILES } from "../data/precompiles.js";

const GetPrecompileInterfacesSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "Precompile name to get (e.g., 'system', 'xcm', 'native_assets'). If omitted, returns all precompiles."
    ),
});

export function registerGetPrecompileInterfaces(server: McpServer): void {
  server.tool(
    "get_precompile_interfaces",
    "Get Polkadot Hub precompile Solidity interfaces. Returns the full Solidity source for ISystem (blake2, sr25519Verify), IXcm (cross-chain messaging), and Native Assets (ERC-20). Use these interfaces to interact with Polkadot-native functionality from Solidity.",
    GetPrecompileInterfacesSchema.shape,
    async (params): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
      const input = params as z.infer<typeof GetPrecompileInterfacesSchema>;

      if (input.name) {
        const precompile = getPrecompile(input.name);
        if (!precompile) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: `Unknown precompile '${input.name}'. Available: ${Object.keys(PRECOMPILES).join(", ")}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  precompile: {
                    name: precompile.name,
                    address: precompile.address,
                    description: precompile.description,
                    soliditySource: precompile.source,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Return all precompiles
      const all = Object.entries(PRECOMPILES).map(([key, info]) => ({
        key,
        name: info.name,
        address: info.address,
        description: info.description,
        soliditySource: info.source,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, precompiles: all }, null, 2),
          },
        ],
      };
    }
  );
}
