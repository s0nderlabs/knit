"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiStream } from "@/lib/api";

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  error: string | null;
}

interface UseChatOptions {
  onToolCall?: (toolCall: ToolCall) => void;
  onAuditStart?: () => void;
  onAuditDone?: () => void;
  onFixStart?: (issueCount: number) => void;
  onFixDone?: () => void;
  onTestStart?: () => void;
  onTestResult?: (result: any) => void;
  onTestDone?: (summary: any) => void;
}

export function useChat(options?: UseChatOptions) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    sessionId: null,
    error: null,
  });

  const streamingContentRef = useRef("");
  const toolCallsRef = useRef<ToolCall[]>([]);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const onToolCallRef = useRef(options?.onToolCall);
  const onAuditStartRef = useRef(options?.onAuditStart);
  const onAuditDoneRef = useRef(options?.onAuditDone);
  const onFixStartRef = useRef(options?.onFixStart);
  const onFixDoneRef = useRef(options?.onFixDone);
  const onTestStartRef = useRef(options?.onTestStart);
  const onTestResultRef = useRef(options?.onTestResult);
  const onTestDoneRef = useRef(options?.onTestDone);

  useEffect(() => {
    sessionIdRef.current = state.sessionId;
  }, [state.sessionId]);

  useEffect(() => {
    onToolCallRef.current = options?.onToolCall;
  }, [options?.onToolCall]);

  useEffect(() => {
    onAuditStartRef.current = options?.onAuditStart;
  }, [options?.onAuditStart]);

  useEffect(() => {
    onAuditDoneRef.current = options?.onAuditDone;
  }, [options?.onAuditDone]);

  useEffect(() => {
    onFixStartRef.current = options?.onFixStart;
  }, [options?.onFixStart]);

  useEffect(() => {
    onFixDoneRef.current = options?.onFixDone;
  }, [options?.onFixDone]);

  useEffect(() => {
    onTestStartRef.current = options?.onTestStart;
  }, [options?.onTestStart]);

  useEffect(() => {
    onTestResultRef.current = options?.onTestResult;
  }, [options?.onTestResult]);

  useEffect(() => {
    onTestDoneRef.current = options?.onTestDone;
  }, [options?.onTestDone]);

  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const flushBuffer = useCallback(() => {
    const content = streamingContentRef.current;
    const tools = toolCallsRef.current;
    const id = streamingIdRef.current;
    if (!id) return;

    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === id
          ? { ...m, content, toolCalls: tools.length > 0 ? [...tools] : m.toolCalls }
          : m,
      ),
    }));
  }, []);

  const stopFlush = useCallback(() => {
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    flushBuffer();
  }, [flushBuffer]);

  const sendMessage = useCallback(
    (text: string, modules: string[] = []) => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      streamingContentRef.current = "";
      toolCallsRef.current = [];
      streamingIdRef.current = assistantId;

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg, assistantMsg],
        isLoading: true,
        error: null,
      }));

      // Start 50ms flush interval
      flushIntervalRef.current = setInterval(flushBuffer, 50);

      abortRef.current = apiStream(
        "/api/chat",
        {
          message: text,
          modules,
          sessionId: sessionIdRef.current,
        },
        {
          onEvent: (event, data) => {
            if (event === "session" && data.sessionId) {
              setState((prev) => ({ ...prev, sessionId: data.sessionId }));
            }

            if (event === "delta" && data.text) {
              streamingContentRef.current += data.text;
            }

            if (event === "tool_call" && data.name) {
              const tc: ToolCall = { name: data.name, input: data.input || {} };
              toolCallsRef.current = [...toolCallsRef.current, tc];
              onToolCallRef.current?.(tc);

              // Finalize the streaming message so typing indicator clears
              if (streamingIdRef.current) {
                const currentContent = streamingContentRef.current;
                const currentToolCalls = [...toolCallsRef.current];
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === streamingIdRef.current
                      ? { ...m, content: currentContent, toolCalls: currentToolCalls, isStreaming: false }
                      : m,
                  ),
                }));
              }
            }

            if (event === "audit_start") {
              onAuditStartRef.current?.();
            }

            if (event === "audit_done") {
              onAuditDoneRef.current?.();
            }

            if (event === "fix_start") {
              onFixStartRef.current?.(data.issueCount || 0);
            }

            if (event === "fix_done") {
              onFixDoneRef.current?.();
            }

            if (event === "test_start") {
              onTestStartRef.current?.();
            }

            if (event === "test_result") {
              onTestResultRef.current?.(data);
            }

            if (event === "test_done") {
              onTestDoneRef.current?.(data);
            }

            if (event === "done") {
              if (data.sessionId) {
                setState((prev) => ({ ...prev, sessionId: data.sessionId }));
              }
              // If no deltas came, animate character reveal
              if (data.result && !streamingContentRef.current) {
                const fullText = data.result;
                let charIndex = 0;
                const CHARS_PER_TICK = 3;
                const TICK_MS = 12;

                stopFlush();
                flushIntervalRef.current = setInterval(() => {
                  charIndex = Math.min(
                    charIndex + CHARS_PER_TICK,
                    fullText.length,
                  );
                  streamingContentRef.current = fullText.slice(0, charIndex);
                  flushBuffer();

                  if (charIndex >= fullText.length) {
                    stopFlush();
                    streamingIdRef.current = null;
                    setState((prev) => ({
                      ...prev,
                      isLoading: false,
                      messages: prev.messages.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: fullText, isStreaming: false }
                          : m,
                      ),
                    }));
                  }
                }, TICK_MS);
                return;
              } else if (data.result) {
                streamingContentRef.current = data.result;
              }
            }

            if (event === "error") {
              setState((prev) => ({
                ...prev,
                error: data.error || "Stream error",
                isLoading: false,
              }));
              stopFlush();
            }
          },
          onError: (err) => {
            setState((prev) => ({
              ...prev,
              error: err.message,
              isLoading: false,
            }));
            stopFlush();
          },
          onDone: () => {
            // If character reveal is running, let it handle finalization
            if (flushIntervalRef.current) return;

            stopFlush();
            streamingIdRef.current = null;

            setState((prev) => ({
              ...prev,
              isLoading: false,
              messages: prev.messages.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: streamingContentRef.current,
                      isStreaming: false,
                    }
                  : m,
              ),
            }));
          },
        },
      );
    },
    [flushBuffer, stopFlush],
  );

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    stopFlush();
    streamingContentRef.current = "";
    toolCallsRef.current = [];
    streamingIdRef.current = null;
    setState({
      messages: [],
      isLoading: false,
      sessionId: null,
      error: null,
    });
  }, [stopFlush]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    sessionId: state.sessionId,
    error: state.error,
    sendMessage,
    reset,
  };
}
