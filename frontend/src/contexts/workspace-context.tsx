"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Module } from "@/lib/modules/catalog";

export interface AuditFinding {
  severity: string;
  title: string;
  description: string;
  confidence: number;
  fix?: string;
}

export type DeployState =
  | "idle"
  | "compiling"
  | "compiled"
  | "deploying"
  | "confirming"
  | "stamping"
  | "done"
  | "error";

export type CompileTarget = "evm" | "pvm";

interface DeployResult {
  contractAddress: string;
  txHash: string;
  registryTxHash?: string;
  explorerUrl: string;
  chainId: number;
  target: CompileTarget;
  modules: string[];
}

interface WorkspaceState {
  // Layout
  codePanelOpen: boolean;
  setCodePanelOpen: (open: boolean) => void;

  // Modules
  selectedModules: Module[];
  addModule: (module: Module) => void;
  removeModule: (moduleId: string) => void;
  clearModules: () => void;

  // Generated code
  generatedCode: string;
  setGeneratedCode: (code: string) => void;
  contractName: string;
  setContractName: (name: string) => void;

  // Chain / target
  selectedChainId: number;
  setSelectedChainId: (id: number) => void;
  compileTarget: CompileTarget;
  setCompileTarget: (target: CompileTarget) => void;

  // Deploy
  deployState: DeployState;
  setDeployState: (state: DeployState) => void;
  deployResult: DeployResult | null;
  setDeployResult: (result: DeployResult | null) => void;
  deployError: string | null;
  setDeployError: (error: string | null) => void;

  // Compilation
  compiledAbi: unknown[] | null;
  setCompiledAbi: (abi: unknown[] | null) => void;
  compiledBytecode: string | null;
  setCompiledBytecode: (bytecode: string | null) => void;

  // Generated test
  generatedTest: string;
  setGeneratedTest: (code: string) => void;
  testName: string;
  setTestName: (name: string) => void;

  // Active tab in code panel
  activeCodeTab: "contract" | "test" | "audit";
  setActiveCodeTab: (tab: "contract" | "test" | "audit") => void;

  // Audit
  auditFindings: AuditFinding[] | null;
  setAuditFindings: (findings: AuditFinding[] | null) => void;
  isAuditing: boolean;
  setIsAuditing: (v: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [selectedChainId, setSelectedChainId] = useState(420420417);
  const [compileTarget, setCompileTarget] = useState<CompileTarget>("evm");
  const [deployState, setDeployState] = useState<DeployState>("idle");
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [compiledAbi, setCompiledAbi] = useState<unknown[] | null>(null);
  const [compiledBytecode, setCompiledBytecode] = useState<string | null>(null);
  const [generatedTest, setGeneratedTest] = useState("");
  const [testName, setTestName] = useState("");
  const [activeCodeTab, setActiveCodeTab] = useState<"contract" | "test" | "audit">("contract");
  const [auditFindings, setAuditFindings] = useState<AuditFinding[] | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const addModule = useCallback((module: Module) => {
    setSelectedModules((prev) => {
      if (prev.some((m) => m.id === module.id)) return prev;
      return [...prev, module];
    });
  }, []);

  const removeModule = useCallback((moduleId: string) => {
    setSelectedModules((prev) => prev.filter((m) => m.id !== moduleId));
  }, []);

  const clearModules = useCallback(() => {
    setSelectedModules([]);
  }, []);

  const value = useMemo<WorkspaceState>(
    () => ({
      codePanelOpen,
      setCodePanelOpen,
      selectedModules,
      addModule,
      removeModule,
      clearModules,
      generatedCode,
      setGeneratedCode,
      contractName,
      setContractName,
      selectedChainId,
      setSelectedChainId,
      compileTarget,
      setCompileTarget,
      deployState,
      setDeployState,
      deployResult,
      setDeployResult,
      deployError,
      setDeployError,
      compiledAbi,
      setCompiledAbi,
      compiledBytecode,
      setCompiledBytecode,
      generatedTest,
      setGeneratedTest,
      testName,
      setTestName,
      activeCodeTab,
      setActiveCodeTab,
      auditFindings,
      setAuditFindings,
      isAuditing,
      setIsAuditing,
    }),
    [
      codePanelOpen,
      selectedModules,
      addModule,
      removeModule,
      clearModules,
      generatedCode,
      contractName,
      selectedChainId,
      compileTarget,
      deployState,
      deployResult,
      deployError,
      compiledAbi,
      compiledBytecode,
      generatedTest,
      testName,
      activeCodeTab,
      auditFindings,
      isAuditing,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
