"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkspace } from "@/contexts/workspace-context";
import { useChat, type Message } from "@/hooks/use-chat";
import { InputBar } from "./input-bar";
import { ExamplePrompts } from "./example-prompts";
import { ClarifyingQuestion } from "./clarifying-question";
import { PlanDisplay } from "./plan-display";
import { MarkdownRenderer } from "./markdown-renderer";
import { TypingIndicator } from "./typing-indicator";

export function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const {
    setCodePanelOpen,
    setGeneratedCode,
    setContractName,
    selectedModules,
  } = useWorkspace();

  const { messages, isLoading, error, sendMessage, reset } = useChat({
    onToolCall: (tc) => {
      if (tc.name === "generate_code" && tc.input.code) {
        setGeneratedCode(tc.input.code as string);
        setContractName((tc.input.contractName as string) || "Contract");
        setCodePanelOpen(true);
      }
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage(text, selectedModules.map((m) => m.id));
    setInput("");
  }, [input, isLoading, sendMessage, selectedModules]);

  const handleExampleSelect = useCallback(
    (prompt: string) => {
      sendMessage(prompt, selectedModules.map((m) => m.id));
    },
    [sendMessage, selectedModules],
  );

  const pendingQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant" || !msg.toolCalls) continue;
      for (const tc of msg.toolCalls) {
        if (tc.name === "ask_question") {
          return tc.input as { question: string; options: string[] };
        }
      }
    }
    return null;
  }, [messages]);

  const hasMessages = messages.length > 0;

  const inputBarElement = (
    <InputBar
      value={input}
      onChange={setInput}
      onSend={handleSend}
      isStreaming={isLoading}
    />
  );

  if (!hasMessages) {
    return (
      <div className="flex flex-1 flex-col pt-16">
        <ExamplePrompts onSelect={handleExampleSelect} inputBar={inputBarElement} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-16">
        <div className="mx-auto max-w-3xl space-y-4 px-5 py-5">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              sendMessage={sendMessage}
              reset={reset}
              selectedModules={selectedModules}
            />
          ))}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-error/20 bg-error-light px-4 py-2 text-sm text-error"
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom input */}
      <AnimatePresence mode="wait">
        {pendingQuestion ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-border/40 px-4 py-3"
          >
            <div className="mx-auto max-w-3xl">
              <ClarifyingQuestion
                question={pendingQuestion.question}
                options={pendingQuestion.options}
                onConfirm={(selected) => {
                  sendMessage(selected, selectedModules.map((m) => m.id));
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 pb-4 pt-2"
          >
            {inputBarElement}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  sendMessage: (text: string, modules: string[]) => void;
  reset: () => void;
  selectedModules: { id: string }[];
}

function MessageBubble({ message, sendMessage, reset, selectedModules }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const toolCallUI = useMemo(() => {
    if (!message.toolCalls || message.toolCalls.length === 0) return null;

    return message.toolCalls.map((tc, i) => {
      if (tc.name === "show_plan") {
        const planInput = tc.input as {
          contractName: string;
          description?: string;
          modules: { name: string; description: string }[];
        };
        return (
          <div key={`plan-${i}`} className="my-3">
            <PlanDisplay
              contractName={planInput.contractName}
              modules={planInput.modules}
              description={planInput.description}
              onBuild={() => sendMessage("Build it", selectedModules.map((m) => m.id))}
              onEdit={() => sendMessage("I want to edit the plan", selectedModules.map((m) => m.id))}
              onStartOver={() => reset()}
            />
          </div>
        );
      }

      if (tc.name === "generate_code") {
        return (
          <motion.div
            key={`code-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="my-2 flex items-center gap-2 rounded-lg bg-accent-light px-3 py-2 text-xs text-ink-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 5.5l1.5 1.5L5 8.5M8 8.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Code generated — see panel
          </motion.div>
        );
      }

      if (tc.name === "request_deploy") {
        return (
          <motion.div
            key={`deploy-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="my-2 flex items-center gap-2 rounded-lg bg-accent-light px-3 py-2 text-xs text-ink-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ready to deploy — use the code panel
          </motion.div>
        );
      }

      return null;
    });
  }, [message.toolCalls, sendMessage, reset, selectedModules]);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-lg bg-accent-light px-4 py-2.5 text-sm leading-relaxed text-ink">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div className="max-w-[85%]">
        {message.content && (
          <div className="rounded-2xl rounded-bl-lg border border-border/50 bg-surface px-4 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <MarkdownRenderer
              content={message.content}
              isAnimating={message.isStreaming}
            />
          </div>
        )}
        {toolCallUI}
        {message.isStreaming && !message.content && (
          <TypingIndicator />
        )}
      </div>
    </motion.div>
  );
}
