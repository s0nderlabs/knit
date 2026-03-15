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
      <div className="space-y-0">
        {steps.map((step, i) => {
          const stepIndex = stateOrder[step.state];
          const isActive = stepIndex === currentIndex;
          const isDone = stepIndex < currentIndex;

          return (
            <div key={step.state} className="flex items-start gap-3">
              {/* Indicator column with connecting line */}
              <div className="flex flex-col items-center">
                {/* Status indicator */}
                <div className="flex h-6 w-6 items-center justify-center">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-success"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M3 6l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  ) : isActive ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-border" />
                  )}
                </div>
                {/* Connecting line */}
                {i < steps.length - 1 && (
                  <div
                    className={`h-4 w-0.5 ${
                      isDone ? "bg-success/30" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`pt-0.5 text-sm ${
                  isActive
                    ? "text-ink font-semibold"
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
