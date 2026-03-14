import { Hono } from "hono";
import { z } from "zod";
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { AppContext } from "../types";
import { KNIT_SYSTEM_PROMPT } from "../prompts/system";

const chat = new Hono<AppContext>();

const ChatBody = z.object({
  message: z.string(),
  sessionId: z.string().nullable().optional(),
  modules: z.array(z.string()).default([]),
});

/**
 * Streams chat responses as SSE-formatted strings.
 * Follows the exact sigil pattern: AsyncGenerator + ReadableStream.
 */
async function* streamChat(params: {
  userMessage: string;
  sessionId?: string | null;
  modules: string[];
}): AsyncGenerator<string> {
  // Tool handlers return MCP content format (same as sigil)
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

  for await (const msg of query({
    prompt: params.userMessage,
    options: options as any,
  })) {
    const m = msg as any;

    // Session init
    if (m.type === "system" && m.subtype === "init") {
      sessionId = m.session_id;
      yield `event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`;
    }

    // Stream events — text deltas (real-time streaming like sigil)
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

    // Assistant messages — extract tool calls to forward to frontend
    if (m.type === "assistant" && m.message?.content) {
      for (const block of m.message.content) {
        if (
          block.type === "tool_use" &&
          block.name?.includes("knit-tools")
        ) {
          const toolName = block.name.replace("mcp__knit-tools__", "");
          yield `event: tool_call\ndata: ${JSON.stringify({ name: toolName, input: block.input })}\n\n`;
        }
      }
    }

    // Final result
    if (m.type === "result") {
      const resultText = m.result || fullText;
      yield `event: done\ndata: ${JSON.stringify({ result: resultText, sessionId })}\n\n`;
    }
  }
}

// POST /api/chat — SSE streaming (sigil pattern: ReadableStream from AsyncGenerator)
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
