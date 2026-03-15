import solc from "solc";
import type { CompileResponse } from "../types";

const OZ_GITHUB_RAW =
  "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.1.0";

function validateImportSuffix(suffix: string, originalPath: string): void {
  if (suffix.includes("..") || suffix.includes("//") || suffix.includes("\0")) {
    throw new Error(`Invalid import path: ${originalPath}`);
  }
}

/**
 * Resolve imports for solc — fetches OpenZeppelin from GitHub
 */
function createImportCallback() {
  const cache = new Map<string, string>();

  return {
    import: (path: string) => {
      const cached = cache.get(path);
      if (cached) return { contents: cached };

      // Will be resolved async in the wrapper
      return { error: `Deferred: ${path}` };
    },
    resolve: async (path: string): Promise<string> => {
      const cached = cache.get(path);
      if (cached) return cached;

      let url: string;
      if (path.startsWith("@openzeppelin/contracts/")) {
        const suffix = path.replace("@openzeppelin/contracts/", "");
        validateImportSuffix(suffix, path);
        url = `${OZ_GITHUB_RAW}/contracts/${suffix}`;
      } else if (path.startsWith("@openzeppelin/")) {
        const suffix = path.replace("@openzeppelin/", "");
        validateImportSuffix(suffix, path);
        url = `${OZ_GITHUB_RAW}/${suffix}`;
      } else {
        throw new Error(`Cannot resolve import: ${path}`);
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      const contents = await res.text();
      cache.set(path, contents);
      return contents;
    },
  };
}

/**
 * Compile with solc (EVM target).
 * Pre-resolves all imports before calling solc synchronously.
 */
function resolveRelativePath(from: string, rel: string): string {
  const dir = from.substring(0, from.lastIndexOf("/"));
  const parts = dir.split("/");
  for (const seg of rel.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

/**
 * Resolve all @openzeppelin imports recursively.
 * Shared by both compileEvm and compilePvm.
 */
async function resolveAllImports(
  sources: Record<string, string>,
): Promise<Record<string, string>> {
  const resolvedSources: Record<string, string> = { ...sources };
  const importCallback = createImportCallback();

  async function walk(source: string, parentPath?: string) {
    const importRegex = /import\s+.*?["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(source)) !== null) {
      let importPath = match[1];
      if ((importPath.startsWith("./") || importPath.startsWith("../")) && parentPath) {
        importPath = resolveRelativePath(parentPath, importPath);
      }
      if (!resolvedSources[importPath]) {
        const contents = await importCallback.resolve(importPath);
        resolvedSources[importPath] = contents;
        await walk(contents, importPath);
      }
    }
  }

  for (const src of Object.values(sources)) {
    await walk(src);
  }
  return resolvedSources;
}

export async function compileEvm(
  sources: Record<string, string>,
  contractName: string
): Promise<CompileResponse> {
  const resolvedSources = await resolveAllImports(sources);

  const input = {
    language: "Solidity",
    sources: Object.fromEntries(
      Object.entries(resolvedSources).map(([name, content]) => [
        name,
        { content },
      ])
    ),
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  const errors =
    output.errors?.filter((e: any) => e.severity === "error") || [];
  const warnings =
    output.errors?.filter((e: any) => e.severity === "warning") || [];

  if (errors.length > 0) {
    return {
      success: false,
      errors: errors.map((e: any) => ({
        severity: e.severity,
        message: e.formattedMessage || e.message,
      })),
      warnings: warnings.map((e: any) => ({
        severity: e.severity,
        message: e.formattedMessage || e.message,
      })),
    };
  }

  // Find the contract in output
  let abi: any[] | undefined;
  let bytecode: string | undefined;

  for (const [, fileOutput] of Object.entries(output.contracts || {})) {
    const contractOutput = (fileOutput as any)[contractName];
    if (contractOutput) {
      abi = contractOutput.abi;
      bytecode = `0x${contractOutput.evm.bytecode.object}`;
      break;
    }
  }

  if (!abi || !bytecode) {
    return {
      success: false,
      errors: [
        {
          severity: "error",
          message: `Contract "${contractName}" not found in compilation output`,
        },
      ],
    };
  }

  return {
    success: true,
    abi,
    bytecode,
    warnings: warnings.map((e: any) => ({
      severity: e.severity,
      message: e.formattedMessage || e.message,
    })),
  };
}

/**
 * Compile with resolc (PVM target).
 */
export async function compilePvm(
  sources: Record<string, string>,
  contractName: string
): Promise<CompileResponse> {
  try {
    const { compile } = await import("@parity/resolc");
    const resolvedSources = await resolveAllImports(sources);

    const input = {
      language: "Solidity",
      sources: Object.fromEntries(
        Object.entries(resolvedSources).map(([name, content]) => [
          name,
          { content },
        ])
      ),
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode.object"],
          },
        },
        optimizer: { enabled: true, runs: 200 },
      },
    };

    const output = await compile(JSON.stringify(input));
    const parsed = JSON.parse(output);

    const errors =
      parsed.errors?.filter((e: any) => e.severity === "error") || [];
    const warnings =
      parsed.errors?.filter((e: any) => e.severity === "warning") || [];

    if (errors.length > 0) {
      return {
        success: false,
        errors: errors.map((e: any) => ({
          severity: e.severity,
          message: e.formattedMessage || e.message,
        })),
        warnings: warnings.map((e: any) => ({
          severity: e.severity,
          message: e.formattedMessage || e.message,
        })),
      };
    }

    let abi: any[] | undefined;
    let pvmBlob: string | undefined;

    for (const [, fileOutput] of Object.entries(parsed.contracts || {})) {
      const contractOutput = (fileOutput as any)[contractName];
      if (contractOutput) {
        abi = contractOutput.abi;
        pvmBlob = `0x${contractOutput.evm?.bytecode?.object || ""}`;
        break;
      }
    }

    if (!abi || !pvmBlob) {
      return {
        success: false,
        errors: [
          {
            severity: "error",
            message: `Contract "${contractName}" not found in PVM compilation output`,
          },
        ],
      };
    }

    return {
      success: true,
      abi,
      pvmBlob,
      warnings: warnings.map((e: any) => ({
        severity: e.severity,
        message: e.formattedMessage || e.message,
      })),
    };
  } catch (err: any) {
    return {
      success: false,
      errors: [{ severity: "error", message: `PVM compilation failed: ${err.message}` }],
    };
  }
}
