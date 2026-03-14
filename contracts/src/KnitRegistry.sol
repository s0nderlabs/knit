// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISystem.sol";

/// @title KnitRegistry — On-chain provenance registry for Knit deployments
/// @notice Stamps AI-assembled contract deployments with merkle proofs of module provenance.
///         Supports blake2 (via Polkadot System precompile) or keccak256 hash modes.
contract KnitRegistry is Ownable {
    // ──────────────────────────────────────────────
    // Constants
    // ──────────────────────────────────────────────

    /// @notice System precompile address on Polkadot Hub
    address public constant SYSTEM_PRECOMPILE = 0x0000000000000000000000000000000000000900;

    /// @notice Whether to use blake2 (true) or keccak256 (false) for merkle hashing
    bool public immutable useBlake2;

    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    struct Deployment {
        address contractAddress;
        address deployer;
        string model;
        bytes32 merkleRoot;
        uint256 timestamp;
    }

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    Deployment[] public deployments;
    mapping(address => uint256[]) private _deployerIndex;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event Registered(
        uint256 indexed id,
        address indexed contractAddress,
        address indexed deployer,
        bytes32 merkleRoot
    );

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @param _useBlake2 true = blake2 via System precompile, false = keccak256
    /// @param _owner Initial owner (backend deployer wallet)
    constructor(bool _useBlake2, address _owner) Ownable(_owner) {
        useBlake2 = _useBlake2;
    }

    // ──────────────────────────────────────────────
    // Write
    // ──────────────────────────────────────────────

    /// @notice Register a new Knit deployment
    /// @param contractAddress The deployed contract address
    /// @param deployer The user who requested the deployment
    /// @param model The AI model used to generate the contract
    /// @param merkleRoot Merkle root of the modules used
    function register(
        address contractAddress,
        address deployer,
        string calldata model,
        bytes32 merkleRoot
    ) external onlyOwner {
        if (contractAddress == address(0)) revert("zero contract address");
        if (deployer == address(0)) revert("zero deployer");
        uint256 id = deployments.length;
        deployments.push(
            Deployment({
                contractAddress: contractAddress,
                deployer: deployer,
                model: model,
                merkleRoot: merkleRoot,
                timestamp: block.timestamp
            })
        );
        _deployerIndex[deployer].push(id);
        emit Registered(id, contractAddress, deployer, merkleRoot);
    }

    // ──────────────────────────────────────────────
    // Read
    // ──────────────────────────────────────────────

    /// @notice Get a deployment by ID
    function getDeployment(uint256 id) external view returns (Deployment memory) {
        return deployments[id];
    }

    /// @notice Get all deployment IDs for a deployer
    function getDeploymentsByDeployer(address deployer) external view returns (uint256[] memory) {
        return _deployerIndex[deployer];
    }

    /// @notice Total number of deployments
    function totalDeployments() external view returns (uint256) {
        return deployments.length;
    }

    // ──────────────────────────────────────────────
    // Merkle Verification
    // ──────────────────────────────────────────────

    /// @notice Verify a merkle proof against a deployment's merkle root
    /// @param deploymentId The deployment to verify against
    /// @param leaf The leaf hash to prove inclusion of
    /// @param proof The merkle proof (sibling hashes)
    /// @return valid True if the proof is valid
    function verify(
        uint256 deploymentId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool valid) {
        bytes32 root = deployments[deploymentId].merkleRoot;
        bytes32 computed = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            if (computed <= proof[i]) {
                computed = _hash(abi.encodePacked(computed, proof[i]));
            } else {
                computed = _hash(abi.encodePacked(proof[i], computed));
            }
        }

        return computed == root;
    }

    // ──────────────────────────────────────────────
    // Internal
    // ──────────────────────────────────────────────

    /// @notice Hash using blake2 (System precompile) or keccak256
    function _hash(bytes memory input) internal view returns (bytes32) {
        if (useBlake2) {
            return ISystem(SYSTEM_PRECOMPILE).hashBlake256(input);
        }
        return keccak256(input);
    }
}
