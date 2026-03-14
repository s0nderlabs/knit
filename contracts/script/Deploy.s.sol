// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/KnitRegistry.sol";

/// @notice Deploy KnitRegistry to any EVM chain
/// @dev Usage: forge script script/Deploy.s.sol --rpc-url <RPC> --private-key <KEY> --broadcast
contract DeployKnitRegistry is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // EVM deploy uses keccak256 (useBlake2 = false)
        // PVM deploy uses blake2 (useBlake2 = true) — done via Hardhat
        bool useBlake2 = vm.envOr("USE_BLAKE2", false);

        vm.startBroadcast(deployerKey);
        KnitRegistry registry = new KnitRegistry(useBlake2, deployer);
        vm.stopBroadcast();

        console.log("KnitRegistry deployed at:", address(registry));
        console.log("  useBlake2:", useBlake2);
        console.log("  owner:", deployer);
    }
}
