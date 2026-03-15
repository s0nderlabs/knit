"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { usePrivy } from "@privy-io/react-auth";
import { useWorkspace } from "@/contexts/workspace-context";
import { apiPost } from "@/lib/api";
import { ChainSelector } from "@/components/deploy/chain-selector";
import { DeployFlow } from "@/components/deploy/deploy-flow";
import { DeployReceipt } from "@/components/deploy/deploy-receipt";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-xs text-ink-tertiary">
      Loading editor...
    </div>
  ),
});

function usePrivySafe(): { walletAddress: string | undefined } {
  try {
    const { user } = usePrivy();
    return { walletAddress: user?.wallet?.address || user?.smartWallet?.address };
  } catch {
    return { walletAddress: undefined };
  }
}

export function CodePanel() {
  const { walletAddress } = usePrivySafe();

  const {
    codePanelOpen,
    setCodePanelOpen,
    generatedCode,
    setGeneratedCode,
    contractName,
    compileTarget,
    deployState,
    setDeployState,
    deployError,
    setDeployError,
    setCompiledAbi,
    setCompiledBytecode,
    compiledBytecode,
    deployResult,
    setDeployResult,
    selectedModules,
    selectedChainId,
    generatedTest,
    testName,
    activeCodeTab,
    setActiveCodeTab,
    auditFindings,
  } = useWorkspace();

  const handleCompile = useCallback(async () => {
    setDeployState("compiling");
    setDeployError(null);

    try {
      const data = await apiPost<{
        success: boolean;
        abi?: unknown[];
        bytecode?: string;
        pvmBlob?: string;
        errors?: { message: string }[];
      }>(`/api/compile/${compileTarget}`, {
        sources: { [`${contractName}.sol`]: generatedCode },
        contractName,
        target: compileTarget,
      });

      if (!data.success) {
        setDeployState("error");
        setDeployError(
          data.errors?.map((e) => e.message).join("\n") ||
            "Compilation failed",
        );
        return;
      }

      setCompiledAbi(data.abi || null);
      setCompiledBytecode(data.bytecode || data.pvmBlob || null);
      setDeployState("compiled");
    } catch (err) {
      setDeployState("error");
      setDeployError(err instanceof Error ? err.message : "Compilation failed");
    }
  }, [
    compileTarget,
    contractName,
    generatedCode,
    setCompiledAbi,
    setCompiledBytecode,
    setDeployError,
    setDeployState,
  ]);

  const handleDeploy = useCallback(async () => {
    if (!walletAddress) {
      setDeployState("error");
      setDeployError("Connect wallet to deploy");
      return;
    }

    try {
      setDeployState("deploying");
      const data = await apiPost<{
        success: boolean;
        error?: string;
        contractAddress?: string;
        txHash?: string;
        registryTxHash?: string;
        explorerUrl?: string;
      }>("/api/deploy", {
        bytecode: compiledBytecode,
        abi: [],
        constructorArgs: [],
        chainId: selectedChainId,
        target: compileTarget,
        deployer: walletAddress,
        model: "claude",
        modules: selectedModules.map((m) => m.id),
      });

      if (!data.success) {
        setDeployState("error");
        setDeployError(data.error || "Deployment failed");
        return;
      }

      setDeployResult(data as any);
      setDeployState("done");
    } catch (err) {
      setDeployState("error");
      setDeployError(err instanceof Error ? err.message : "Deployment failed");
    }
  }, [
    compiledBytecode,
    compileTarget,
    selectedChainId,
    selectedModules,
    walletAddress,
    setDeployError,
    setDeployResult,
    setDeployState,
  ]);

  return (
    <AnimatePresence>
      {codePanelOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-ink/10 lg:hidden"
            onClick={() => setCodePanelOpen(false)}
          />

          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-14 bottom-0 z-30 flex w-full flex-col border-l border-border/50 bg-surface lg:relative lg:top-0 lg:w-[50%] lg:min-w-[480px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveCodeTab("contract")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                      activeCodeTab === "contract"
                        ? "bg-accent-light font-semibold text-ink"
                        : "text-ink-tertiary hover:text-ink-secondary"
                    }`}
                  >
                    {contractName || "Contract"}.sol
                  </button>
                  {generatedTest && (
                    <button
                      onClick={() => setActiveCodeTab("test")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                        activeCodeTab === "test"
                          ? "bg-success-light font-semibold text-success"
                          : "text-ink-tertiary hover:text-ink-secondary"
                      }`}
                    >
                      {testName || "Contract"}.t.sol
                    </button>
                  )}
                  {auditFindings && (
                    <button
                      onClick={() => setActiveCodeTab("audit")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeCodeTab === "audit"
                          ? "bg-accent-light font-semibold text-ink"
                          : "text-ink-tertiary hover:text-ink-secondary"
                      }`}
                    >
                      Audit
                      {auditFindings.length > 0 && (
                        <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          {auditFindings.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <ChainSelector />
              </div>

              <div className="flex items-center gap-2">
                {/* Compile button */}
                {activeCodeTab === "test" && generatedTest && (
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedTest)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink"
                  >
                    Copy
                  </button>
                )}
                <button
                  onClick={handleCompile}
                  disabled={
                    !generatedCode ||
                    activeCodeTab !== "contract" ||
                    deployState === "compiling" ||
                    deployState === "deploying"
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-30 ${
                    deployState === "compiled"
                      ? "bg-success text-white"
                      : "bg-ink text-white hover:bg-ink/85"
                  }`}
                >
                  {deployState === "compiling"
                    ? "Compiling..."
                    : deployState === "compiled"
                      ? "Compiled"
                      : "Compile"}
                </button>

                {/* Deploy button */}
                <button
                  onClick={handleDeploy}
                  disabled={
                    deployState !== "compiled" || !walletAddress
                  }
                  title={!walletAddress ? "Connect wallet to deploy" : undefined}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-30"
                >
                  {walletAddress ? "Deploy" : "Connect wallet"}
                </button>

                {/* Close */}
                <button
                  onClick={() => setCodePanelOpen(false)}
                  className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-base hover:text-ink"
                  aria-label="Close code panel"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M4 4l6 6M10 4l-6 6"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error/success banner */}
            {deployState === "error" && deployError && (
              <div className="bg-error-light text-error border-b border-error/20 px-4 py-2 text-xs">
                <strong>Error:</strong> {deployError}
                <button
                  onClick={() => {
                    setDeployState("idle");
                    setDeployError(null);
                  }}
                  className="ml-2 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            {deployState === "compiled" && (
              <div className="bg-success-light text-success border-b border-success/20 px-4 py-2 text-xs">
                Compiled successfully. {walletAddress ? "Ready to deploy." : "Connect wallet to deploy."}
              </div>
            )}

            {/* Editor or deploy state */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {deployState === "done" && deployResult ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <DeployReceipt />
                </div>
              ) : deployState === "deploying" || deployState === "confirming" || deployState === "stamping" ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <DeployFlow />
                </div>
              ) : activeCodeTab === "audit" && auditFindings ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {auditFindings.length === 0 ? (
                      <div className="rounded-xl border border-success/20 bg-success-light p-4 text-center">
                        <p className="text-sm font-medium text-success">No vulnerabilities found</p>
                        <p className="mt-1 text-xs text-ink-tertiary">The contract passed all security checks.</p>
                      </div>
                    ) : (
                      auditFindings.map((finding, i) => {
                        const severityColors: Record<string, string> = {
                          Critical: "border-error/30 bg-error-light",
                          High: "border-warning/30 bg-warning-light",
                          Medium: "border-border bg-accent-light",
                          Low: "border-border bg-surface",
                        };
                        const badgeColors: Record<string, string> = {
                          Critical: "bg-error text-white",
                          High: "bg-warning text-white",
                          Medium: "bg-ink-tertiary text-white",
                          Low: "bg-border text-ink-secondary",
                        };
                        return (
                          <div
                            key={i}
                            className={`rounded-xl border p-4 ${severityColors[finding.severity] || "border-border bg-surface"}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${badgeColors[finding.severity] || "bg-border text-ink"}`}>
                                {finding.severity}
                              </span>
                              <span className="text-xs text-ink-tertiary">
                                {finding.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-ink">{finding.title}</p>
                            <p className="mt-1 text-xs text-ink-secondary leading-relaxed">{finding.description}</p>
                            {finding.fix && (
                              <div className="mt-2 rounded-lg bg-surface border border-border p-2">
                                <p className="text-[10px] font-semibold text-ink-tertiary uppercase mb-1">Suggested Fix</p>
                                <p className="text-xs text-ink-secondary">{finding.fix}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <Editor
                  height="100%"
                  language="sol"
                  value={activeCodeTab === "test" ? generatedTest : generatedCode}
                  onChange={(v) => {
                    if (activeCodeTab === "contract") setGeneratedCode(v || "");
                  }}
                  key={activeCodeTab}
                  theme="vs"
                  options={{
                    fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                    fontSize: 13,
                    lineHeight: 20,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: "none",
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    scrollbar: {
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                    wordWrap: "on",
                    readOnly: activeCodeTab === "test",
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
