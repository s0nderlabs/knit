import { blake2b } from "@noble/hashes/blake2b";
import { bytesToHex } from "@noble/hashes/utils";

/**
 * Compute blake2b-256 hash of data.
 */
export function blake2Hash(data: Uint8Array): Uint8Array {
  return blake2b(data, { dkLen: 32 });
}

/**
 * Hash a string using blake2b-256.
 */
export function hashString(s: string): string {
  const bytes = new TextEncoder().encode(s);
  return `0x${bytesToHex(blake2Hash(bytes))}`;
}

/**
 * Build a blake2b merkle tree from leaf data.
 * Returns the merkle root and the tree layers.
 */
export function buildMerkleTree(leaves: string[]): {
  root: string;
  layers: string[][];
} {
  if (leaves.length === 0) {
    return { root: "0x" + "00".repeat(32), layers: [] };
  }

  // Hash each leaf
  let currentLayer = leaves.map((leaf) => hashString(leaf));
  const layers: string[][] = [currentLayer];

  // Build tree bottom-up
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;

      // Sort pair for deterministic ordering
      const [a, b] = left < right ? [left, right] : [right, left];
      const combined = new TextEncoder().encode(a + b);
      nextLayer.push(`0x${bytesToHex(blake2Hash(combined))}`);
    }
    currentLayer = nextLayer;
    layers.push(currentLayer);
  }

  return {
    root: currentLayer[0],
    layers,
  };
}

/**
 * Generate a merkle proof for a leaf at the given index.
 */
export function getMerkleProof(
  layers: string[][],
  leafIndex: number
): string[] {
  const proof: string[] = [];
  let index = leafIndex;

  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1;

    if (siblingIndex < layer.length) {
      proof.push(layer[siblingIndex]);
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

/**
 * Build a deployment merkle root from module IDs + source hash.
 */
export function buildDeploymentMerkle(params: {
  modules: string[];
  sourceHash: string;
  model: string;
  deployer: string;
}): { root: string; leaves: string[] } {
  const leaves = [
    ...params.modules.map((m) => `module:${m}`),
    `source:${params.sourceHash}`,
    `model:${params.model}`,
    `deployer:${params.deployer}`,
  ];

  const { root } = buildMerkleTree(leaves);
  return { root, leaves };
}
