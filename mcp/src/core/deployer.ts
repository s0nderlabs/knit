import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  encodeDeployData,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface DeployInput {
  bytecode: string;
  abi: any[];
  constructorArgs?: any[];
  rpcUrl: string;
  chainId: number;
  privateKey: string;
}

export interface DeployOutput {
  success: boolean;
  contractAddress?: string;
  txHash?: string;
  error?: string;
}

export async function deployContract(input: DeployInput): Promise<DeployOutput> {
  try {
    const chain = defineChain({
      id: input.chainId,
      name: input.chainId === 420420417 ? "Polkadot Hub Testnet" : `Chain ${input.chainId}`,
      nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
      rpcUrls: {
        default: { http: [input.rpcUrl] },
      },
    });

    const account = privateKeyToAccount(input.privateKey as Hex);

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(input.rpcUrl),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(input.rpcUrl),
    });

    // Encode deploy data
    const deployData = encodeDeployData({
      abi: input.abi,
      bytecode: input.bytecode as Hex,
      args: input.constructorArgs || [],
    });

    // Send deployment transaction
    const txHash = await walletClient.sendTransaction({
      data: deployData,
      chain,
    });

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (!receipt.contractAddress) {
      return {
        success: false,
        txHash,
        error: "Transaction confirmed but no contract address in receipt",
      };
    }

    return {
      success: true,
      contractAddress: receipt.contractAddress,
      txHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown deployment error",
    };
  }
}

export interface PvmDeployInput {
  pvmBytecode: string;
  abi: any[];
  constructorArgs?: any[];
  rpcUrl: string;
  chainId: number;
  privateKey: string;
}

export interface PvmDeployOutput {
  success: boolean;
  contractAddress?: string;
  uploadTxHash?: string;
  instantiateTxHash?: string;
  error?: string;
  note?: string;
}

export async function deployPvmContract(input: PvmDeployInput): Promise<PvmDeployOutput> {
  // PVM deployment is a two-step process:
  // 1. Upload code blob
  // 2. Instantiate contract by code hash
  // This requires the Hardhat @parity/hardhat-polkadot-resolc plugin.
  // For MCP, we provide the bytecode and instructions.
  return {
    success: false,
    error: "PVM deployment requires Hardhat with @parity/hardhat-polkadot-resolc plugin. Use the backend /api/deploy endpoint for PVM deployments, or deploy via Hardhat CLI.",
    note: "PVM deployment is a two-step process: (1) upload code blob, (2) instantiate by code hash. The MCP server can compile PVM bytecode — use the backend or Hardhat for the actual deployment.",
  };
}
