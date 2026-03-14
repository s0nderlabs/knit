import { defineChain } from "viem";

export const polkadotHubTestnet = defineChain({
  id: 420420417,
  name: "Polkadot Hub Testnet",
  nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://services.polkadothub-rpc.com/testnet"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io",
    },
  },
});

export const polkadotHubMainnet = defineChain({
  id: 420420419,
  name: "Polkadot Hub",
  nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://services.polkadothub-rpc.com/mainnet"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.polkadot.io",
    },
  },
});

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  nativeCurrency: string;
  supportsEvm: boolean;
  supportsPvm: boolean;
}

export const CHAINS: Record<number, ChainConfig> = {
  420420417: {
    id: 420420417,
    name: "Polkadot Hub Testnet",
    rpcUrl: "https://services.polkadothub-rpc.com/testnet",
    explorerUrl: "https://blockscout-testnet.polkadot.io",
    explorerApiUrl: "https://blockscout-testnet.polkadot.io/api",
    nativeCurrency: "DOT",
    supportsEvm: true,
    supportsPvm: true,
  },
  420420419: {
    id: 420420419,
    name: "Polkadot Hub",
    rpcUrl: "https://services.polkadothub-rpc.com/mainnet",
    explorerUrl: "https://blockscout.polkadot.io",
    explorerApiUrl: "https://blockscout.polkadot.io/api",
    nativeCurrency: "DOT",
    supportsEvm: true,
    supportsPvm: true,
  },
  1: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    explorerApiUrl: "https://api.etherscan.io/api",
    nativeCurrency: "ETH",
    supportsEvm: true,
    supportsPvm: false,
  },
  137: {
    id: 137,
    name: "Polygon",
    rpcUrl: "https://polygon.llamarpc.com",
    explorerUrl: "https://polygonscan.com",
    explorerApiUrl: "https://api.polygonscan.com/api",
    nativeCurrency: "MATIC",
    supportsEvm: true,
    supportsPvm: false,
  },
  42161: {
    id: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    explorerApiUrl: "https://api.arbiscan.io/api",
    nativeCurrency: "ETH",
    supportsEvm: true,
    supportsPvm: false,
  },
  10: {
    id: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    explorerApiUrl: "https://api-optimistic.etherscan.io/api",
    nativeCurrency: "ETH",
    supportsEvm: true,
    supportsPvm: false,
  },
  8453: {
    id: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    explorerApiUrl: "https://api.basescan.org/api",
    nativeCurrency: "ETH",
    supportsEvm: true,
    supportsPvm: false,
  },
};

export function getChain(chainId: number): ChainConfig | undefined {
  return CHAINS[chainId];
}

export function isPolkadotHub(chainId: number): boolean {
  return chainId === 420420417 || chainId === 420420419;
}
