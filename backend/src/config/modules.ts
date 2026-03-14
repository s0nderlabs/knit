export interface ModuleMetadata {
  id: string;
  name: string;
  category: "openzeppelin" | "polkadot-precompile" | "imported";
  description: string;
  importPath?: string;
  source?: string;
}

export const OZ_MODULES: ModuleMetadata[] = [
  // Token Standards
  {
    id: "oz-erc20",
    name: "ERC-20",
    category: "openzeppelin",
    description: "Fungible token standard",
    importPath: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
  },
  {
    id: "oz-erc721",
    name: "ERC-721",
    category: "openzeppelin",
    description: "Non-fungible token standard",
    importPath: "@openzeppelin/contracts/token/ERC721/ERC721.sol",
  },
  {
    id: "oz-erc1155",
    name: "ERC-1155",
    category: "openzeppelin",
    description: "Multi-token standard",
    importPath: "@openzeppelin/contracts/token/ERC1155/ERC1155.sol",
  },
  // Access Control
  {
    id: "oz-ownable",
    name: "Ownable",
    category: "openzeppelin",
    description: "Single-owner access control",
    importPath: "@openzeppelin/contracts/access/Ownable.sol",
  },
  {
    id: "oz-access-control",
    name: "AccessControl",
    category: "openzeppelin",
    description: "Role-based access control",
    importPath: "@openzeppelin/contracts/access/AccessControl.sol",
  },
  // Extensions
  {
    id: "oz-erc20-burnable",
    name: "ERC20Burnable",
    category: "openzeppelin",
    description: "Burnable ERC-20 extension",
    importPath: "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol",
  },
  {
    id: "oz-erc20-pausable",
    name: "ERC20Pausable",
    category: "openzeppelin",
    description: "Pausable ERC-20 extension",
    importPath: "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol",
  },
  {
    id: "oz-erc20-permit",
    name: "ERC20Permit",
    category: "openzeppelin",
    description: "Gasless approvals via EIP-2612",
    importPath: "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol",
  },
  {
    id: "oz-erc20-votes",
    name: "ERC20Votes",
    category: "openzeppelin",
    description: "Voting power tracking for ERC-20",
    importPath: "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol",
  },
  {
    id: "oz-erc721-enumerable",
    name: "ERC721Enumerable",
    category: "openzeppelin",
    description: "Enumerable ERC-721 extension",
    importPath: "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol",
  },
  {
    id: "oz-erc721-uri-storage",
    name: "ERC721URIStorage",
    category: "openzeppelin",
    description: "Per-token URI metadata",
    importPath: "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol",
  },
  // Security
  {
    id: "oz-pausable",
    name: "Pausable",
    category: "openzeppelin",
    description: "Emergency pause mechanism",
    importPath: "@openzeppelin/contracts/utils/Pausable.sol",
  },
  {
    id: "oz-reentrancy-guard",
    name: "ReentrancyGuard",
    category: "openzeppelin",
    description: "Reentrancy attack protection",
    importPath: "@openzeppelin/contracts/utils/ReentrancyGuard.sol",
  },
  // Governance
  {
    id: "oz-governor",
    name: "Governor",
    category: "openzeppelin",
    description: "On-chain governance framework",
    importPath: "@openzeppelin/contracts/governance/Governor.sol",
  },
  {
    id: "oz-timelock",
    name: "TimelockController",
    category: "openzeppelin",
    description: "Timelock for governance proposals",
    importPath: "@openzeppelin/contracts/governance/TimelockController.sol",
  },
  // Proxy
  {
    id: "oz-uups",
    name: "UUPSUpgradeable",
    category: "openzeppelin",
    description: "UUPS proxy pattern for upgradeability",
    importPath: "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol",
  },
  // Utils
  {
    id: "oz-multicall",
    name: "Multicall",
    category: "openzeppelin",
    description: "Batch multiple calls in one transaction",
    importPath: "@openzeppelin/contracts/utils/Multicall.sol",
  },
];

export const PRECOMPILE_MODULES: ModuleMetadata[] = [
  {
    id: "pc-xcm",
    name: "XCM",
    category: "polkadot-precompile",
    description: "Cross-Consensus Messaging — send and execute cross-chain messages",
    source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title XCM Precompile Interface
/// @notice Address: 0x0000000000000000000000000000000000000A0000
interface IXcm {
    /// @notice Send a SCALE-encoded XCM message
    /// @param dest SCALE-encoded MultiLocation destination
    /// @param message SCALE-encoded XCM message
    function send(bytes calldata dest, bytes calldata message) external;

    /// @notice Execute a SCALE-encoded XCM message locally
    /// @param message SCALE-encoded XCM message
    /// @param maxWeight Maximum weight for execution
    function execute(bytes calldata message, uint64 maxWeight) external;
}`,
  },
  {
    id: "pc-system",
    name: "System",
    category: "polkadot-precompile",
    description: "sr25519 verification, blake2 hashing, account ID conversion",
    source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title System Precompile Interface
/// @notice Address: 0x0000000000000000000000000000000000000900
interface ISystem {
    /// @notice Verify an sr25519 signature
    function sr25519Verify(
        bytes32 pubKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool);

    /// @notice Compute blake2b-256 hash
    function blake2b256(bytes calldata data) external view returns (bytes32);

    /// @notice Convert an H160 address to a Polkadot AccountId32
    function toAccountId(address evmAddress) external view returns (bytes32);

    /// @notice Check if the caller is the original extrinsic origin
    function callerIsOrigin() external view returns (bool);
}`,
  },
];

export const ALL_MODULES: ModuleMetadata[] = [...OZ_MODULES, ...PRECOMPILE_MODULES];

export function getModuleById(id: string): ModuleMetadata | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function getModulesByCategory(
  category: ModuleMetadata["category"]
): ModuleMetadata[] {
  return ALL_MODULES.filter((m) => m.category === category);
}
