export interface PrecompileInfo {
  name: string;
  address: string;
  description: string;
  source: string;
}

export const PRECOMPILES: Record<string, PrecompileInfo> = {
  system: {
    name: "System",
    address: "0x0000000000000000000000000000000000000900",
    description:
      "Polkadot Hub System precompile — provides sr25519 signature verification, blake2 hashing, account ID conversion, and caller origin checks.",
    source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/// @title ISystem — Polkadot Hub System Precompile
/// @notice Address: 0x0000000000000000000000000000000000000900
/// @dev Provides access to Polkadot-native cryptographic and identity functions.
interface ISystem {
    /// @notice Verify an sr25519 signature
    /// @param pubkey The 32-byte sr25519 public key
    /// @param sig The 64-byte sr25519 signature
    /// @param message The message that was signed
    /// @return true if the signature is valid
    function sr25519Verify(
        bytes32 pubkey,
        bytes calldata sig,
        bytes calldata message
    ) external view returns (bool);

    /// @notice Compute a blake2b-256 hash
    /// @param data The data to hash
    /// @return The 32-byte blake2b-256 hash
    function blake2(bytes calldata data) external view returns (bytes32);

    /// @notice Convert an Ethereum address to a Substrate AccountId32
    /// @param evmAddress The 20-byte Ethereum address
    /// @return The 32-byte Substrate account ID
    function toAccountId(address evmAddress) external view returns (bytes32);

    /// @notice Check if the caller is the origin (not a contract call)
    /// @return true if the caller is the transaction origin
    function callerIsOrigin() external view returns (bool);
}`,
  },

  xcm: {
    name: "XCM",
    address: "0x0000000000000000000000000000000000000A0000",
    description:
      "Polkadot Hub XCM (Cross-Consensus Messaging) precompile — enables cross-chain message sending and execution. Messages must be SCALE-encoded.",
    source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/// @title IXcm — Polkadot Hub XCM Precompile
/// @notice Enables cross-chain messaging via XCM (Cross-Consensus Messaging)
/// @dev Messages must be SCALE-encoded XCM instructions. Over 50 testnet transactions confirm this works.
interface IXcm {
    /// @notice Send an XCM message to another chain
    /// @param dest SCALE-encoded destination MultiLocation
    /// @param message SCALE-encoded XCM message (VersionedXcm)
    function send(
        bytes calldata dest,
        bytes calldata message
    ) external;

    /// @notice Execute an XCM message locally
    /// @param message SCALE-encoded XCM message
    /// @param maxWeight Maximum weight (ref_time, proof_size) as SCALE-encoded Weight
    function execute(
        bytes calldata message,
        bytes calldata maxWeight
    ) external;
}`,
  },

  native_assets: {
    name: "Native Assets (ERC-20)",
    address: "prefix-derived (varies per asset)",
    description:
      "Polkadot Hub exposes DOT and foreign assets as ERC-20 tokens at prefix-derived addresses. Interact using the standard IERC20 interface.",
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title IERC20 — Standard ERC-20 interface for Polkadot Hub Native Assets
/// @notice DOT and foreign assets are accessible as ERC-20 tokens at prefix-derived addresses.
/// @dev No special interface needed — use standard IERC20. The Polkadot Hub runtime
///      maps native asset operations to ERC-20 calls transparently.
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}`,
  },
};

export function getPrecompile(name: string): PrecompileInfo | undefined {
  return PRECOMPILES[name.toLowerCase()];
}

export function listPrecompiles(): Array<{ name: string; address: string; description: string }> {
  return Object.values(PRECOMPILES).map(({ name, address, description }) => ({
    name,
    address,
    description,
  }));
}
