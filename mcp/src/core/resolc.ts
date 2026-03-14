import { compile, type SolcInput, type SolcOutput } from "@parity/resolc";

export interface ResolcInput {
  sources: Record<string, string>;
  contractName: string;
}

export interface ResolcOutput {
  success: boolean;
  abi?: any[];
  pvmBytecode?: string;
  errors?: Array<{ severity: string; message: string; formattedMessage?: string }>;
  warnings?: Array<{ severity: string; message: string; formattedMessage?: string }>;
}

export async function compilePvm(input: ResolcInput): Promise<ResolcOutput> {
  // @parity/resolc compile() takes SolcInput: { [filename]: { content: string } }
  // and returns SolcOutput directly (not a JSON string)
  const sources: SolcInput = Object.fromEntries(
    Object.entries(input.sources).map(([name, content]) => [
      name,
      { content },
    ])
  );

  const output: SolcOutput = await compile(sources, {
    optimizer: { enabled: true, runs: 200 },
  });

  const errors: ResolcOutput["errors"] = [];
  const warnings: ResolcOutput["warnings"] = [];

  if (output.errors) {
    for (const err of output.errors) {
      const entry = {
        severity: err.severity,
        message: err.message,
        formattedMessage: err.formattedMessage,
      };
      if (err.severity === "error") {
        errors.push(entry);
      } else {
        warnings.push(entry);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Find the target contract in output
  for (const fileName of Object.keys(output.contracts || {})) {
    const contracts = output.contracts[fileName];
    if (contracts[input.contractName]) {
      const contract = contracts[input.contractName];
      return {
        success: true,
        abi: contract.abi,
        pvmBytecode: "0x" + contract.evm.bytecode.object,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  // Fallback to first contract
  for (const fileName of Object.keys(output.contracts || {})) {
    const contracts = output.contracts[fileName];
    const names = Object.keys(contracts);
    if (names.length > 0) {
      const contract = contracts[names[0]];
      return {
        success: true,
        abi: contract.abi,
        pvmBytecode: "0x" + contract.evm.bytecode.object,
        warnings: [
          ...(warnings || []),
          {
            severity: "warning",
            message: `Contract '${input.contractName}' not found, returning '${names[0]}' instead`,
          },
        ],
      };
    }
  }

  return {
    success: false,
    errors: [{ severity: "error", message: "No contracts found in resolc output" }],
  };
}
