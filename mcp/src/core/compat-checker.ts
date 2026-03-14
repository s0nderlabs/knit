export interface CompatIssue {
  severity: "error" | "warning" | "info";
  pattern: string;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface CompatResult {
  compatible: boolean;
  issues: CompatIssue[];
  summary: string;
}

interface PatternCheck {
  regex: RegExp;
  severity: CompatIssue["severity"];
  pattern: string;
  message: string;
  suggestion?: string;
}

const PVM_CHECKS: PatternCheck[] = [
  // Compile-time errors (will not compile with resolc)
  {
    regex: /\bassembly\s*\{[^}]*\bpc\b/gs,
    severity: "error",
    pattern: "pc opcode",
    message: "The `pc` opcode is not supported in PVM. resolc will reject this.",
    suggestion: "Remove usage of `pc` opcode — it has no equivalent in PVM.",
  },
  {
    regex: /\bextcodecopy\b/g,
    severity: "error",
    pattern: "extcodecopy",
    message: "`extcodecopy` is not supported in PVM.",
    suggestion: "Use `extcodesize` or pass code via calldata instead.",
  },
  {
    regex: /\bblobhash\b/g,
    severity: "error",
    pattern: "blobhash",
    message: "`blobhash` opcode is not available in PVM.",
    suggestion: "Remove blob-related logic — PVM does not support EIP-4844.",
  },
  {
    regex: /\bblobbasefee\b/g,
    severity: "error",
    pattern: "blobbasefee",
    message: "`blobbasefee` is not available in PVM.",
    suggestion: "Remove blob-related logic.",
  },
  {
    regex: /\bassembly\s*\{[^}]*\bcreate\s*\(/gs,
    severity: "error",
    pattern: "create in assembly",
    message: "`create` opcode in inline assembly is not supported in PVM.",
    suggestion: "Use Solidity-level `new` for contract creation instead of assembly `create`.",
  },
  {
    regex: /\bassembly\s*\{[^}]*\bcreate2\s*\(/gs,
    severity: "error",
    pattern: "create2 in assembly",
    message: "`create2` opcode in inline assembly is not supported in PVM.",
    suggestion: "Use Solidity-level `new` with salt for deterministic deployment.",
  },
  {
    regex: /\bselfdestruct\b/g,
    severity: "error",
    pattern: "selfdestruct",
    message: "`selfdestruct` is not supported in PVM (also deprecated in EVM since Cancun).",
    suggestion: "Use a `pause` or `disable` pattern instead of selfdestruct.",
  },

  // Semantic differences (compiles but behaves differently)
  {
    regex: /\.transfer\s*\(/g,
    severity: "warning",
    pattern: "transfer()",
    message: "`transfer()` forwards only 2300 gas on EVM, but PVM forwards all gas. This removes reentrancy protection.",
    suggestion: "Use OpenZeppelin's ReentrancyGuard + low-level `call` instead of `transfer`.",
  },
  {
    regex: /\.send\s*\(/g,
    severity: "warning",
    pattern: "send()",
    message: "`send()` has the same 2300 gas stipend issue as `transfer()` on PVM.",
    suggestion: "Use ReentrancyGuard + low-level `call` instead of `send`.",
  },
  {
    regex: /\bdelegat[eE]?call\b/g,
    severity: "warning",
    pattern: "delegatecall",
    message: "`delegatecall` works but PVM call stack depth is limited to 5 (vs 1024 on EVM).",
    suggestion: "Minimize call chain depth. Consider inlining logic instead of delegatecall proxies.",
  },
  {
    regex: /\bgasleft\s*\(\)/g,
    severity: "warning",
    pattern: "gasleft()",
    message: "PVM uses a 3-dimensional gas model (ref_time, proof_size, storage_deposit). `gasleft()` may not behave as expected.",
    suggestion: "Avoid gas-dependent logic. PVM does not implement the 63/64 gas rule.",
  },
  {
    regex: /\bprevrandao\b/g,
    severity: "info",
    pattern: "prevrandao",
    message: "`prevrandao` returns a constant value (2500000000000000) on PVM — not suitable for randomness.",
    suggestion: "Use an oracle or VRF for randomness instead of prevrandao.",
  },
  {
    regex: /\bdifficulty\b/g,
    severity: "info",
    pattern: "difficulty",
    message: "`difficulty` returns a constant value (2500000000000000) on PVM.",
    suggestion: "Do not rely on difficulty for any logic.",
  },
];

export function checkPvmCompatibility(source: string): CompatResult {
  const issues: CompatIssue[] = [];

  for (const check of PVM_CHECKS) {
    // Reset regex state
    check.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = check.regex.exec(source)) !== null) {
      // Estimate line number
      const beforeMatch = source.substring(0, match.index);
      const line = beforeMatch.split("\n").length;

      issues.push({
        severity: check.severity,
        pattern: check.pattern,
        message: check.message,
        line,
        suggestion: check.suggestion,
      });
    }
  }

  // Bytecode size estimation warning
  const contractCount = (source.match(/\bcontract\s+\w+/g) || []).length;
  const storageVarCount = (source.match(/\b(uint|int|bool|address|bytes|string|mapping)\d*\s+(public\s+|private\s+|internal\s+)?\w+\s*[;=]/g) || []).length;

  if (storageVarCount > 15) {
    issues.push({
      severity: "warning",
      pattern: "bytecode size",
      message: `Contract has ~${storageVarCount} storage variables. PVM bytecode is 10-20x larger than EVM — each SLOAD/SSTORE adds ~1.2-1.4KB. Risk of exceeding 48KB initcode limit.`,
      suggestion: "Split into multiple smaller contracts or use a proxy pattern to stay under the 48KB PVM initcode limit.",
    });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const compatible = errorCount === 0;
  let summary: string;

  if (issues.length === 0) {
    summary = "No PVM compatibility issues detected. Contract appears safe to compile with resolc.";
  } else if (compatible) {
    summary = `PVM compatible with ${warningCount} warning(s) and ${infoCount} info note(s). Review warnings for behavioral differences.`;
  } else {
    summary = `PVM incompatible: ${errorCount} error(s) that will prevent compilation. ${warningCount} warning(s), ${infoCount} info note(s).`;
  }

  return { compatible, issues, summary };
}
