import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polkadotHubTestnet } from "../config/chains";

// KnitRegistry ABI — must match KnitRegistry.sol exactly
const REGISTRY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "deployer", type: "address" },
      { name: "model", type: "string" },
      { name: "merkleRoot", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "verify",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "deploymentId", type: "uint256" },
      { name: "leaf", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [{ name: "valid", type: "bool" }],
  },
  {
    name: "getDeployment",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "contractAddress", type: "address" },
          { name: "deployer", type: "address" },
          { name: "model", type: "string" },
          { name: "merkleRoot", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getDeploymentsByDeployer",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "deployer", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const;

function getRegistryAddress(target: "evm" | "pvm"): Hex {
  const addr =
    target === "evm"
      ? process.env.KNIT_REGISTRY_EVM
      : process.env.KNIT_REGISTRY_PVM;
  if (!addr) throw new Error(`Registry address not set for ${target}`);
  return addr as Hex;
}

function getRpcUrl(rpcUrl?: string) {
  return (
    rpcUrl ||
    process.env.RPC_URL_POLKADOT_TESTNET ||
    "https://services.polkadothub-rpc.com/testnet"
  );
}

function getPublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: polkadotHubTestnet,
    transport: http(getRpcUrl(rpcUrl)),
  });
}

function getWalletClient(rpcUrl?: string) {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

  const account = privateKeyToAccount(privateKey as Hex);
  return createWalletClient({
    account,
    chain: polkadotHubTestnet,
    transport: http(getRpcUrl(rpcUrl)),
  });
}

/**
 * Register a deployment in the KnitRegistry on-chain.
 */
export async function registerDeployment(params: {
  contractAddress: Hex;
  deployer: Hex;
  model: string;
  merkleRoot: Hex;
  target: "evm" | "pvm";
}): Promise<string> {
  const walletClient = getWalletClient();
  const publicClient = getPublicClient();
  const registryAddress = getRegistryAddress(params.target);

  const txHash = await walletClient.writeContract({
    address: registryAddress,
    abi: REGISTRY_ABI,
    functionName: "register",
    args: [
      params.contractAddress,
      params.deployer,
      params.model,
      params.merkleRoot,
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Get deployment info from the registry.
 */
export async function getDeployment(
  id: bigint,
  target: "evm" | "pvm"
) {
  const publicClient = getPublicClient();
  const registryAddress = getRegistryAddress(target);

  return publicClient.readContract({
    address: registryAddress,
    abi: REGISTRY_ABI,
    functionName: "getDeployment",
    args: [id],
  });
}

/**
 * Get all deployments by a deployer address.
 */
export async function getDeploymentsByDeployer(
  deployer: Hex,
  target: "evm" | "pvm"
) {
  const publicClient = getPublicClient();
  const registryAddress = getRegistryAddress(target);

  return publicClient.readContract({
    address: registryAddress,
    abi: REGISTRY_ABI,
    functionName: "getDeploymentsByDeployer",
    args: [deployer],
  });
}
