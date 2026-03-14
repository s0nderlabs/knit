import type { Module } from "./catalog";

export const polkadotModules: Module[] = [
  {
    id: "pc-xcm",
    name: "XCM",
    description: "Cross-Consensus Messaging — send and execute cross-chain messages",
    category: "polkadot",
    tags: ["cross-chain", "messaging", "xcm"],
    importPath: "IXcm.sol",
    docsUrl: "https://docs.polkadot.com/develop/smart-contracts/",
  },
  {
    id: "pc-system",
    name: "System",
    description: "sr25519 verification, blake2 hashing, account ID conversion",
    category: "polkadot",
    tags: ["crypto", "system", "blake2"],
    importPath: "ISystem.sol",
  },
  {
    id: "pc-native-assets",
    name: "Native Assets",
    description: "DOT & foreign assets as ERC-20",
    category: "polkadot",
    tags: ["token", "native", "dot"],
    importPath: "IERC20.sol",
  },
  {
    id: "pc-storage",
    name: "Storage",
    description: "On-chain key-value storage precompile",
    category: "polkadot",
    tags: ["storage", "state"],
    importPath: "IStorage.sol",
  },
];
