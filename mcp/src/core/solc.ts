import solc from "solc";

export interface SolcInput {
  sources: Record<string, string>;
  contractName: string;
  evmVersion?: string;
  optimizerRuns?: number;
}

export interface SolcOutput {
  success: boolean;
  abi?: any[];
  bytecode?: string;
  errors?: Array<{ severity: string; message: string; formattedMessage?: string }>;
  warnings?: Array<{ severity: string; message: string; formattedMessage?: string }>;
}

export function compileEvm(input: SolcInput): SolcOutput {
  const standardInput = {
    language: "Solidity",
    sources: Object.fromEntries(
      Object.entries(input.sources).map(([name, content]) => [
        name,
        { content },
      ])
    ),
    settings: {
      evmVersion: input.evmVersion || "paris",
      optimizer: {
        enabled: true,
        runs: input.optimizerRuns ?? 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(standardInput)));

  const errors: SolcOutput["errors"] = [];
  const warnings: SolcOutput["warnings"] = [];

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
        bytecode: "0x" + contract.evm.bytecode.object,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  // If contractName not found, try to return the first contract
  for (const fileName of Object.keys(output.contracts || {})) {
    const contracts = output.contracts[fileName];
    const names = Object.keys(contracts);
    if (names.length > 0) {
      const contract = contracts[names[0]];
      return {
        success: true,
        abi: contract.abi,
        bytecode: "0x" + contract.evm.bytecode.object,
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
    errors: [{ severity: "error", message: "No contracts found in compilation output" }],
  };
}
