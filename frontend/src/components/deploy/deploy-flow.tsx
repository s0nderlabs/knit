"use client";

import { motion } from "framer-motion";
import { useWorkspace, type DeployState } from "@/contexts/workspace-context";

const steps: { state: DeployState; label: string }[] = [
  { state: "compiling", label: "Compiling contract..." },
  { state: "compiled", label: "Compilation successful" },
  { state: "deploying", label: "Deploying to chain..." },
  { state: "confirming", label: "Waiting for confirmation..." },
  { state: "stamping", label: "Stamping registry..." },
  { state: "done", label: "Deployment complete" },
];

const stateOrder: Record<DeployState, number> = {
  idle: -1,
  compiling: 0,
  compiled: 1,
  deploying: 2,
  confirming: 3,
  stamping: 4,
  done: 5,
  error: -2,
};

export function DeployFlow() {
  const { deployState, deployError, setDeployState } = useWorkspace();

  if (deployState === "idle") return null;

  if (deployState === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-error/20 bg-error-light p-4"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Deployment failed
        </div>
        {deployError && (
          <p className="mt-1.5 text-xs text-error/80">{deployError}</p>
        )}
        <button
          onClick={() => setDeployState("idle")}
          className="mt-3 rounded-md border border-error/20 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  const currentIndex = stateOrder[deployState];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-base p-4"
    >
      <div className="space-y-3">
        {steps.map((step, i) => {
          const stepIndex = stateOrder[step.state];
          const isActive = stepIndex === currentIndex;
          const isDone = stepIndex < currentIndex;
          const isPending = stepIndex > currentIndex;

          return (
            <div key={step.state} className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="flex h-5 w-5 items-center justify-center">
                {isDone ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <circle cx="8" cy="8" r="7" fill="#059669" />
                    <path
                      d="M5 8l2 2 4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                ) : isActive ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-soft border-t-indigo" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-border" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm ${
                  isActive
                    ? "font-medium text-ink"
                    : isDone
                      ? "text-success"
                      : "text-ink-tertiary"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
