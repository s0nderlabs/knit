import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
  type Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChain, CHAINS, polkadotHubTestnet, polkadotHubMainnet } from "../config/chains";

function getViemChain(chainId: number) {
  if (chainId === 420420417) return polkadotHubTestnet;
  if (chainId === 420420419) return polkadotHubMainnet;
  return undefined;
}

export interface DeployResult {
  contractAddress: string;
  txHash: string;
  explorerUrl: string;
}

/**
 * Deploy a contract via EVM (viem).
 */
export async function deployEvm(params: {
  bytecode: Hex;
  abi: Abi;
  constructorArgs: any[];
  chainId: number;
  deployer: string; // user's address — set as owner if applicable
}): Promise<DeployResult> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

  const chain = getViemChain(params.chainId);
  if (!chain) throw new Error(`Unsupported chain: ${params.chainId}`);

  const chainConfig = getChain(params.chainId);
  if (!chainConfig) throw new Error(`No chain config for ${params.chainId}`);

  const account = privateKeyToAccount(privateKey as Hex);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(chainConfig.rpcUrl),
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(chainConfig.rpcUrl),
  });

  const txHash = await walletClient.deployContract({
    abi: params.abi,
    bytecode: params.bytecode,
    args: params.constructorArgs,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  if (!receipt.contractAddress) {
    throw new Error("Deployment failed — no contract address in receipt");
  }

  return {
    contractAddress: receipt.contractAddress,
    txHash,
    explorerUrl: `${chainConfig.explorerUrl}/address/${receipt.contractAddress}`,
  };
}

/**
 * Deploy a contract via PVM (hardhat subprocess).
 * Stub — will shell out to hardhat ignition in backend/hardhat/
 */
export async function deployPvm(params: {
  pvmBlob: string;
  abi: any[];
  constructorArgs: any[];
  chainId: number;
}): Promise<DeployResult> {
  // PVM deploy requires two-step process via Hardhat
  // 1. Deploy code blob
  // 2. Instantiate with constructor args
  // This will be implemented with a hardhat subprocess
  throw new Error(
    "PVM deployment not yet implemented — requires Hardhat subprocess"
  );
}
