import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

export interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  duration: string;
  reason?: string;
}

export interface CoverageResult {
  file: string;
  lines: string;
  statements: string;
  branches: string;
  functions: string;
}

export interface TestRunResult {
  results: TestResult[];
  coverage: CoverageResult[];
  passed: number;
  failed: number;
  total: number;
}

const CONTRACTS_DIR = join(import.meta.dir, "../../..", "contracts");
const FORGE_PATH = process.env.FORGE_PATH || "forge";

/**
 * Run Foundry tests on generated contract + test code.
 * Writes temp files to the contracts/ project, runs forge, parses results, cleans up.
 */
export async function runTests(
  contractCode: string,
  testCode: string,
  contractName: string,
): Promise<TestRunResult> {
  const id = contractName.replace(/\W/g, "") + "_" + Date.now();
  const srcFile = `_KnitTemp_${id}.sol`;
  const testFile = `_KnitTemp_${id}.t.sol`;
  const srcPath = join(CONTRACTS_DIR, "src", srcFile);
  const testPath = join(CONTRACTS_DIR, "test", testFile);

  try {
    // Write contract source
    writeFileSync(srcPath, contractCode, "utf-8");

    // Fix import paths in test code to point to our temp file
    const fixedTestCode = testCode.replace(
      /import\s+.*?["']\.\.\/src\/[^"']+["']/g,
      `import "../src/${srcFile}"`,
    );
    writeFileSync(testPath, fixedTestCode, "utf-8");

    // Run forge test --json
    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    try {
      const testOutput = execSync(
        `${FORGE_PATH} test --json --match-path "test/${testFile}" 2>/dev/null`,
        { cwd: CONTRACTS_DIR, timeout: 120_000, encoding: "utf-8" },
      );

      const parsed = JSON.parse(testOutput);
      for (const [, suite] of Object.entries(parsed) as [string, any][]) {
        for (const [testName, testData] of Object.entries(suite.test_results || {}) as [string, any][]) {
          const status = testData.status === "Success" ? "pass" : testData.status === "Skipped" ? "skip" : "fail";
          const dur = testData.duration || {};
          const duration = typeof dur === "string" ? dur : `${dur.secs || 0}s ${Math.round((dur.nanos || 0) / 1_000_000)}ms`;

          results.push({
            name: testName.replace(/\(\)$/, ""),
            status,
            duration,
            reason: status === "fail" ? testData.reason || undefined : undefined,
          });

          if (status === "pass") passed++;
          else if (status === "fail") failed++;
        }
      }
    } catch (err: any) {
      // forge test returns non-zero on failures — try to parse stderr/stdout
      if (err.stdout) {
        try {
          const parsed = JSON.parse(err.stdout);
          for (const [, suite] of Object.entries(parsed) as [string, any][]) {
            for (const [testName, testData] of Object.entries(suite.test_results || {}) as [string, any][]) {
              const status = testData.status === "Success" ? "pass" : "fail";
              results.push({
                name: testName.replace(/\(\)$/, ""),
                status,
                duration: "",
                reason: status === "fail" ? testData.reason || undefined : undefined,
              });
              if (status === "pass") passed++;
              else if (status === "fail") failed++;
            }
          }
        } catch {
          // Can't parse — report as compilation/test error
          results.push({
            name: "Test execution",
            status: "fail",
            duration: "",
            reason: err.stderr?.toString()?.substring(0, 500) || err.message,
          });
          failed = 1;
        }
      }
    }

    // Run forge coverage
    const coverage: CoverageResult[] = [];
    try {
      const coverageOutput = execSync(
        `${FORGE_PATH} coverage --report summary --match-path "test/${testFile}" 2>/dev/null`,
        { cwd: CONTRACTS_DIR, timeout: 120_000, encoding: "utf-8" },
      );

      // Parse coverage table: | File | % Lines | % Statements | % Branches | % Funcs |
      const lines = coverageOutput.split("\n");
      for (const line of lines) {
        if (line.includes("|") && line.includes("%") && !line.includes("Total") && !line.includes("File")) {
          const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
          if (cells.length >= 5) {
            // Only include the contract file, not test/deploy files
            const fileName = cells[0];
            if (fileName.includes("_KnitTemp_") && !fileName.includes(".t.sol") && !fileName.includes("Deploy")) {
              coverage.push({
                file: contractName + ".sol",
                lines: cells[1],
                statements: cells[2],
                branches: cells[3],
                functions: cells[4],
              });
            }
          }
        }
      }
    } catch {
      // Coverage is best-effort — don't fail if it errors
    }

    return { results, coverage, passed, failed, total: passed + failed };
  } finally {
    // Cleanup temp files
    try { if (existsSync(srcPath)) unlinkSync(srcPath); } catch {}
    try { if (existsSync(testPath)) unlinkSync(testPath); } catch {}
  }
}
