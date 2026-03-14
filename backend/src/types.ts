export interface Env {
  DATABASE_URL: string;
  DEPLOYER_PRIVATE_KEY: string;
  ANTHROPIC_API_KEY?: string;
  RPC_URL_POLKADOT_TESTNET: string;
  KNIT_REGISTRY_EVM?: string;
  KNIT_REGISTRY_PVM?: string;
  PORT?: string;
}

export type Variables = {
  userId?: string;
};

export type AppContext = {
  Bindings: Env;
  Variables: Variables;
};

// POST /api/compile/evm and /api/compile/pvm
export interface CompileRequest {
  sources: Record<string, string>; // filename → source
  contractName: string;
  target: "evm" | "pvm";
}

export interface CompileResponse {
  success: boolean;
  abi?: any[];
  bytecode?: string; // EVM hex
  pvmBlob?: string; // PVM hex
  errors?: { severity: string; message: string }[];
  warnings?: { severity: string; message: string }[];
}

// POST /api/deploy
export interface DeployRequest {
  bytecode: string;
  abi: any[];
  constructorArgs: any[];
  chainId: number;
  target: "evm" | "pvm";
  deployer: string; // user's address (for ownership)
  model: string; // AI model used
  modules: string[]; // module IDs used
}

export interface DeployResponse {
  success: boolean;
  contractAddress: string;
  txHash: string;
  registryTxHash?: string; // stamp tx (Polkadot Hub only)
  explorerUrl: string;
}
