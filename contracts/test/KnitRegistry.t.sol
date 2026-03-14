// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/KnitRegistry.sol";

/// @dev Mock System precompile that implements hashBlake256 using keccak256
///      (since we can't run real blake2 in Foundry's EVM)
contract MockSystem {
    function hashBlake256(bytes memory input) external pure returns (bytes32) {
        // Use keccak256 as stand-in — the point is to test the call path
        return keccak256(input);
    }
}

contract KnitRegistryTest is Test {
    KnitRegistry public registryKeccak;
    KnitRegistry public registryBlake;
    MockSystem public mockSystem;

    address public owner = address(this);
    address public user = address(0xBEEF);
    address public deployed = address(0xCAFE);

    function setUp() public {
        // Deploy keccak256 mode registry
        registryKeccak = new KnitRegistry(false, owner);

        // Deploy mock System precompile and etch it at 0x0900
        mockSystem = new MockSystem();
        vm.etch(
            address(0x0000000000000000000000000000000000000900),
            address(mockSystem).code
        );

        // Deploy blake2 mode registry
        registryBlake = new KnitRegistry(true, owner);
    }

    // ─── Registration ───────────────────────────────

    function test_register() public {
        bytes32 root = keccak256("modules");
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", root);

        KnitRegistry.Deployment memory d = registryKeccak.getDeployment(0);
        assertEq(d.contractAddress, deployed);
        assertEq(d.deployer, user);
        assertEq(keccak256(bytes(d.model)), keccak256(bytes("claude-sonnet-4-6")));
        assertEq(d.merkleRoot, root);
        assertEq(d.timestamp, block.timestamp);
    }

    function test_register_emitsEvent() public {
        bytes32 root = keccak256("modules");
        vm.expectEmit(true, true, true, true);
        emit KnitRegistry.Registered(0, deployed, user, root);
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", root);
    }

    function test_register_onlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", bytes32(0));
    }

    function test_register_revertsZeroContractAddress() public {
        vm.expectRevert("zero contract address");
        registryKeccak.register(address(0), user, "claude-sonnet-4-6", bytes32(0));
    }

    function test_register_revertsZeroDeployer() public {
        vm.expectRevert("zero deployer");
        registryKeccak.register(deployed, address(0), "claude-sonnet-4-6", bytes32(0));
    }

    function test_totalDeployments() public {
        assertEq(registryKeccak.totalDeployments(), 0);
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", bytes32(0));
        assertEq(registryKeccak.totalDeployments(), 1);
    }

    // ─── Deployer Index ─────────────────────────────

    function test_getDeploymentsByDeployer() public {
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", bytes32(0));
        registryKeccak.register(address(0xDEAD), user, "claude-sonnet-4-6", bytes32(0));
        registryKeccak.register(address(0xFACE), address(0x1234), "claude-sonnet-4-6", bytes32(0));

        uint256[] memory userDeploys = registryKeccak.getDeploymentsByDeployer(user);
        assertEq(userDeploys.length, 2);
        assertEq(userDeploys[0], 0);
        assertEq(userDeploys[1], 1);
    }

    // ─── Merkle Verification (keccak256 mode) ───────

    function test_verify_keccak_singleLeaf() public {
        // Single leaf = root
        bytes32 leaf = keccak256(abi.encodePacked("@openzeppelin/ERC20"));
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", leaf);

        bytes32[] memory proof = new bytes32[](0);
        assertTrue(registryKeccak.verify(0, leaf, proof));
    }

    function test_verify_keccak_twoLeaves() public {
        bytes32 leafA = keccak256(abi.encodePacked("@openzeppelin/ERC20"));
        bytes32 leafB = keccak256(abi.encodePacked("@openzeppelin/Ownable"));

        // Build root: sorted pair hash
        bytes32 root;
        if (leafA <= leafB) {
            root = keccak256(abi.encodePacked(leafA, leafB));
        } else {
            root = keccak256(abi.encodePacked(leafB, leafA));
        }

        registryKeccak.register(deployed, user, "claude-sonnet-4-6", root);

        // Prove leafA with leafB as sibling
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafB;
        assertTrue(registryKeccak.verify(0, leafA, proof));

        // Prove leafB with leafA as sibling
        proof[0] = leafA;
        assertTrue(registryKeccak.verify(0, leafB, proof));
    }

    function test_verify_keccak_invalidProof() public {
        bytes32 leaf = keccak256(abi.encodePacked("@openzeppelin/ERC20"));
        bytes32 root = keccak256(abi.encodePacked(leaf, keccak256(abi.encodePacked("sibling"))));
        registryKeccak.register(deployed, user, "claude-sonnet-4-6", root);

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = keccak256(abi.encodePacked("wrong-sibling"));
        assertFalse(registryKeccak.verify(0, leaf, proof));
    }

    // ─── Merkle Verification (blake2 mode via mock) ─

    function test_verify_blake2_singleLeaf() public {
        // MockSystem uses keccak256, so the math is the same — we're testing the call path
        bytes32 leaf = keccak256(abi.encodePacked("@openzeppelin/ERC20"));
        registryBlake.register(deployed, user, "claude-sonnet-4-6", leaf);

        bytes32[] memory proof = new bytes32[](0);
        assertTrue(registryBlake.verify(0, leaf, proof));
    }

    function test_verify_blake2_twoLeaves() public {
        bytes32 leafA = keccak256(abi.encodePacked("@openzeppelin/ERC20"));
        bytes32 leafB = keccak256(abi.encodePacked("@openzeppelin/Ownable"));

        // MockSystem uses keccak256, so root computation is same
        bytes32 root;
        if (leafA <= leafB) {
            root = keccak256(abi.encodePacked(leafA, leafB));
        } else {
            root = keccak256(abi.encodePacked(leafB, leafA));
        }

        registryBlake.register(deployed, user, "claude-sonnet-4-6", root);

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafB;
        assertTrue(registryBlake.verify(0, leafA, proof));
    }

    // ─── Config ─────────────────────────────────────

    function test_useBlake2_flag() public view {
        assertFalse(registryKeccak.useBlake2());
        assertTrue(registryBlake.useBlake2());
    }

    function test_systemPrecompile() public view {
        assertEq(
            registryKeccak.SYSTEM_PRECOMPILE(),
            address(0x0000000000000000000000000000000000000900)
        );
    }
}
