import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCompileEvm } from "./compile-evm.js";
import { registerCompilePvm } from "./compile-pvm.js";
import { registerCheckPvmCompat } from "./check-pvm-compat.js";
import { registerDeploy } from "./deploy.js";
import { registerGetPrecompileInterfaces } from "./get-precompile-interfaces.js";

export function registerTools(server: McpServer): void {
  registerCompileEvm(server);
  registerCompilePvm(server);
  registerCheckPvmCompat(server);
  registerDeploy(server);
  registerGetPrecompileInterfaces(server);
}
