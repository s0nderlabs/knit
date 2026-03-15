import { Hono } from "hono";
import { z } from "zod";
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { AppContext } from "../types";
import { KNIT_SYSTEM_PROMPT } from "../prompts/system";
import { AUDITOR_SYSTEM_PROMPT } from "../prompts/auditor";
import { runTests } from "../services/test-runner";

const chat = new Hono<AppContext>();

const ChatBody = z.object({
  message: z.string(),
  sessionId: z.string().nullable().optional(),
  modules: z.array(z.string()).default([]),
});

interface AuditFinding {
  severity: string;
  title: string;
  description: string;
  confidence: number;
  fix?: string;
}

interface AuditResult {
  findings: AuditFinding[];
  chunks: string[];
  testCode: string;
}

/**
 * Run the auditor agent. Returns findings + SSE chunks to yield.
 */
async function runAuditor(contractCode: string, contractName: string, generateTests: boolean): Promise<AuditResult> {
  const toolResponse = (data: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  });

  const auditorTools = [
    tool(
      "audit_result",
      "Report security audit findings for the contract",
      {
        findings: z.array(z.object({
          severity: z.enum(["Critical", "High", "Medium", "Low"]),
          title: z.string(),
          description: z.string(),
          confidence: z.number(),
          fix: z.string().optional(),
        })),
      },
      async (args: any) => toolResponse({ status: "audit_complete", count: args.findings?.length }),
    ),
    tool(
      "generate_test",
      "Generate a comprehensive Foundry test file for the contract",
      {
        contractName: z.string().describe("The contract being tested"),
        testCode: z.string().describe("Complete Foundry test file source code"),
      },
      async (args: any) => toolResponse({ status: "test_generated", contractName: args.contractName }),
    ),
  ];

  const server = createSdkMcpServer({ name: "knit-auditor", tools: auditorTools });

  const testInstruction = generateTests
    ? "\n\nCall audit_result first with findings, then call generate_test with the complete test file."
    : "\n\nCall audit_result with your findings. Do NOT generate tests this round.";

  const prompt = `Audit this Solidity contract.

Contract: ${contractName}

\`\`\`solidity
${contractCode}
\`\`\`${testInstruction}`;

  const chunks: string[] = [];
  let findings: AuditFinding[] = [];
  let testCode = "";

  for await (const msg of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      systemPrompt: AUDITOR_SYSTEM_PROMPT,
      mcpServers: { "knit-auditor": server },
      maxTurns: 5,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    } as any,
  })) {
    const m = msg as any;

    if (m.type === "assistant" && m.message?.content) {
      for (const block of m.message.content) {
        if (block.type === "tool_use" && block.name?.includes("knit-auditor")) {
          const toolName = block.name.replace("mcp__knit-auditor__", "");
          chunks.push(`event: tool_call\ndata: ${JSON.stringify({ name: toolName, input: block.input })}\n\n`);

          if (toolName === "audit_result" && block.input?.findings) {
            findings = block.input.findings as AuditFinding[];
          }
          if (toolName === "generate_test" && block.input?.testCode) {
            testCode = block.input.testCode as string;
          }
        }
      }
    }
  }

  return { findings, chunks, testCode };
}

/**
 * Run the fixer agent — takes code + findings, returns fixed code.
 */
async function runFixer(contractCode: string, contractName: string, findings: AuditFinding[]): Promise<{ fixedCode: string; chunks: string[] }> {
  const toolResponse = (data: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  });

  const fixerTools = [
    tool(
      "generate_code",
      "Emit the fixed Solidity contract code",
      {
        contractName: z.string(),
        filename: z.string(),
        code: z.string(),
      },
      async (args: any) => toolResponse({ status: "code_fixed", contractName: args.contractName }),
    ),
  ];

  const server = createSdkMcpServer({ name: "knit-fixer", tools: fixerTools });

  const findingsText = findings
    .filter((f) => f.confidence >= 75)
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.title}: ${f.description}${f.fix ? ` Fix: ${f.fix}` : ""}`)
    .join("\n");

  const prompt = `Fix the following security issues in this Solidity contract. Preserve ALL existing functionality. Only fix the issues listed.

Contract: ${contractName}

\`\`\`solidity
${contractCode}
\`\`\`

Security issues to fix:
${findingsText}

Call generate_code with the COMPLETE fixed contract. Do not omit any existing code.`;

  const chunks: string[] = [];
  let fixedCode = "";

  for await (const msg of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      systemPrompt: "You are a Solidity developer fixing security issues. Output the complete fixed contract using the generate_code tool. Preserve all existing functionality.",
      mcpServers: { "knit-fixer": server },
      maxTurns: 3,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    } as any,
  })) {
    const m = msg as any;

    if (m.type === "assistant" && m.message?.content) {
      for (const block of m.message.content) {
        if (block.type === "tool_use" && block.name?.includes("knit-fixer")) {
          const toolName = block.name.replace("mcp__knit-fixer__", "");
          chunks.push(`event: tool_call\ndata: ${JSON.stringify({ name: toolName, input: block.input })}\n\n`);

          if (toolName === "generate_code" && block.input?.code) {
            fixedCode = block.input.code as string;
          }
        }
      }
    }
  }

  return { fixedCode, chunks };
}

/**
 * Streams chat responses as SSE-formatted strings.
 * After generate_code, automatically spawns the auditor agent.
 */
async function* streamChat(params: {
  userMessage: string;
  sessionId?: string | null;
  modules: string[];
}): AsyncGenerator<string> {
  const toolResponse = (data: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  });

  const tools = [
    tool(
      "ask_question",
      "Ask the user a clarifying question with single-select options",
      {
        question: z.string().describe("The question to ask"),
        options: z.array(z.string()).describe("2-4 single-select options"),
      },
      async (args: any) =>
        toolResponse({ status: "question_shown", question: args.question }),
    ),
    tool(
      "show_plan",
      "Show the user a build plan with module tree before generating code",
      {
        contractName: z.string().describe("Name of the contract to build"),
        description: z
          .string()
          .describe("Brief description of what will be built"),
        modules: z
          .array(
            z.object({
              name: z.string().describe("Module display name"),
              description: z.string().describe("What this module provides"),
            }),
          )
          .describe("List of OZ/precompile modules that will be used"),
      },
      async (args: any) =>
        toolResponse({
          status: "plan_shown",
          contractName: args.contractName,
        }),
    ),
    tool(
      "generate_code",
      "Generate complete, compilable Solidity smart contract code. The code will appear in the user's IDE panel.",
      {
        contractName: z.string().describe("Contract name"),
        filename: z.string().describe("Filename (e.g. KnitCoin.sol)"),
        code: z.string().describe("Complete Solidity source code"),
      },
      async (args: any) =>
        toolResponse({
          status: "code_generated",
          contractName: args.contractName,
          filename: args.filename,
        }),
    ),
    tool(
      "request_deploy",
      "Request deployment of the generated contract",
      {
        contractName: z.string(),
        chainId: z.number(),
        target: z.enum(["evm", "pvm"]),
      },
      async (args: any) =>
        toolResponse({
          status: "deploy_requested",
          contractName: args.contractName,
        }),
    ),
  ];

  const server = createSdkMcpServer({ name: "knit-tools", tools });

  const moduleContext =
    params.modules.length > 0
      ? `\n\nThe user has selected these modules: ${params.modules.join(", ")}`
      : "";

  const systemPrompt = `${KNIT_SYSTEM_PROMPT}${moduleContext}`;

  const options: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    betas: ["context-1m-2025-08-07"],
    maxThinkingTokens: 10000,
    systemPrompt,
    mcpServers: { "knit-tools": server },
    maxTurns: 15,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    persistSession: true,
  };

  if (params.sessionId) {
    options.resume = params.sessionId;
  }

  let sessionId = params.sessionId || "";
  let fullText = "";
  let generatedCode = "";
  let generatedContractName = "";

  for await (const msg of query({
    prompt: params.userMessage,
    options: options as any,
  })) {
    const m = msg as any;

    if (m.type === "system" && m.subtype === "init") {
      sessionId = m.session_id;
      yield `event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`;
    }

    if (m.type === "stream_event" && m.parent_tool_use_id === null) {
      const evt = m.event;
      if (
        evt?.type === "content_block_delta" &&
        evt?.delta?.type === "text_delta" &&
        evt?.delta?.text
      ) {
        fullText += evt.delta.text;
        yield `event: delta\ndata: ${JSON.stringify({ text: evt.delta.text })}\n\n`;
      }
    }

    if (m.type === "assistant" && m.message?.content) {
      for (const block of m.message.content) {
        if (
          block.type === "tool_use" &&
          block.name?.includes("knit-tools")
        ) {
          const toolName = block.name.replace("mcp__knit-tools__", "");
          yield `event: tool_call\ndata: ${JSON.stringify({ name: toolName, input: block.input })}\n\n`;

          // Capture generated code for the auditor
          if (toolName === "generate_code" && block.input?.code) {
            generatedCode = block.input.code;
            generatedContractName = block.input.contractName || "Contract";
          }
        }
      }
    }

    if (m.type === "result") {
      const resultText = m.result || fullText;
      yield `event: done\ndata: ${JSON.stringify({ result: resultText, sessionId })}\n\n`;
    }
  }

  // After builder completes, run the audit-fix loop
  if (generatedCode) {
    const MAX_ITERATIONS = 3;
    let currentCode = generatedCode;
    let iteration = 0;

    try {
      while (iteration < MAX_ITERATIONS) {
        iteration++;
        const isLastIteration = iteration === MAX_ITERATIONS;
        const isFirstIteration = iteration === 1;

        // Run auditor (only generate tests on the final pass)
        yield `event: audit_start\ndata: ${JSON.stringify({ contractName: generatedContractName, iteration })}\n\n`;

        const audit = await runAuditor(currentCode, generatedContractName, false);

        // Yield audit chunks (findings)
        for (const chunk of audit.chunks) {
          yield chunk;
        }

        // Filter actionable findings (confidence >= 75, not Low)
        const actionable = audit.findings.filter(
          (f) => f.confidence >= 75 && f.severity !== "Low",
        );

        yield `event: audit_done\ndata: ${JSON.stringify({ status: "complete", iteration, actionableCount: actionable.length, totalCount: audit.findings.length })}\n\n`;

        // If no actionable findings or last iteration, generate tests and stop
        if (actionable.length === 0 || isLastIteration) {
          // Generate tests on the final clean code
          yield `event: audit_start\ndata: ${JSON.stringify({ contractName: generatedContractName, phase: "testing" })}\n\n`;

          const finalAudit = await runAuditor(currentCode, generatedContractName, true);
          for (const chunk of finalAudit.chunks) {
            yield chunk;
          }

          yield `event: audit_done\ndata: ${JSON.stringify({ status: "complete", phase: "testing" })}\n\n`;

          // Run tests if test code was generated
          if (finalAudit.testCode) {
            yield `event: test_start\ndata: ${JSON.stringify({ contractName: generatedContractName })}\n\n`;
            try {
              const testRun = await runTests(currentCode, finalAudit.testCode, generatedContractName);
              for (const result of testRun.results) {
                yield `event: test_result\ndata: ${JSON.stringify(result)}\n\n`;
              }
              yield `event: test_done\ndata: ${JSON.stringify({ passed: testRun.passed, failed: testRun.failed, total: testRun.total, coverage: testRun.coverage })}\n\n`;
            } catch (err) {
              yield `event: test_done\ndata: ${JSON.stringify({ passed: 0, failed: 0, total: 0, error: err instanceof Error ? err.message : "Test execution failed" })}\n\n`;
            }
          }
          break;
        }

        // Fix the code
        yield `event: fix_start\ndata: ${JSON.stringify({ contractName: generatedContractName, iteration, issueCount: actionable.length })}\n\n`;

        const fix = await runFixer(currentCode, generatedContractName, actionable);

        for (const chunk of fix.chunks) {
          yield chunk;
        }

        if (fix.fixedCode) {
          currentCode = fix.fixedCode;
          yield `event: fix_done\ndata: ${JSON.stringify({ iteration })}\n\n`;
        } else {
          // Fixer failed to produce code, stop looping
          yield `event: fix_done\ndata: ${JSON.stringify({ iteration, error: "Fixer did not produce code" })}\n\n`;

          // Still generate tests on whatever we have
          const fallbackAudit = await runAuditor(currentCode, generatedContractName, true);
          for (const chunk of fallbackAudit.chunks) {
            yield chunk;
          }
          // Run tests on fallback
          if (fallbackAudit.testCode) {
            yield `event: test_start\ndata: ${JSON.stringify({ contractName: generatedContractName })}\n\n`;
            try {
              const testRun = await runTests(currentCode, fallbackAudit.testCode, generatedContractName);
              for (const result of testRun.results) {
                yield `event: test_result\ndata: ${JSON.stringify(result)}\n\n`;
              }
              yield `event: test_done\ndata: ${JSON.stringify({ passed: testRun.passed, failed: testRun.failed, total: testRun.total, coverage: testRun.coverage })}\n\n`;
            } catch (err) {
              yield `event: test_done\ndata: ${JSON.stringify({ passed: 0, failed: 0, total: 0, error: err instanceof Error ? err.message : "Test execution failed" })}\n\n`;
            }
          }
          break;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Audit loop failed";
      console.error("Audit loop error:", errorMsg);
      yield `event: audit_done\ndata: ${JSON.stringify({ status: "error", error: errorMsg })}\n\n`;
    }
  }
}

// POST /api/chat — SSE streaming
chat.post("/api/chat", async (c) => {
  const body = await c.req.json();
  const parsed = ChatBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { message, sessionId, modules } = parsed.data;

  const encoder = new TextEncoder();
  let closed = false;

  const generator = streamChat({
    userMessage: message,
    sessionId,
    modules,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          /* controller already closed */
        }
      }, 15_000);

      try {
        for await (const chunk of generator) {
          if (closed) break;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("Chat stream error:", errorMsg);
        if (!closed) {
          try {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`,
              ),
            );
          } catch {
            /* controller already closed */
          }
        }
      } finally {
        clearInterval(keepalive);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

export default chat;
