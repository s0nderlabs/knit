// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ISystem — Polkadot Hub System Precompile
/// @notice Interface for the System precompile at 0x0000000000000000000000000000000000000900
interface ISystem {
    /// @notice Compute a blake2-256 hash of the input
    /// @param input The data to hash
    /// @return digest The 32-byte blake2-256 digest
    function hashBlake256(bytes memory input) external pure returns (bytes32 digest);
}
