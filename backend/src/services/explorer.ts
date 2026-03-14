import { getChain } from "../config/chains";

export interface ExplorerContract {
  address: string;
  chain: string;
  name?: string;
  source?: string;
  abi?: any[];
  compiler?: string;
}

/**
 * Fetch verified contract source from Blockscout API.
 */
async function fetchFromBlockscout(
  apiUrl: string,
  address: string
): Promise<ExplorerContract | null> {
  const url = `${apiUrl}?module=contract&action=getsourcecode&address=${address}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "1" || !data.result?.[0]) return null;

  const contract = data.result[0];
  if (!contract.SourceCode) return null;

  let abi: any[] | undefined;
  try {
    abi = JSON.parse(contract.ABI);
  } catch {
    // ABI might not be valid JSON
  }

  return {
    address,
    chain: "",
    name: contract.ContractName || undefined,
    source: contract.SourceCode,
    abi,
    compiler: contract.CompilerVersion || undefined,
  };
}

/**
 * Fetch verified contract source from a chain's block explorer.
 */
export async function fetchContractSource(
  chainId: number,
  address: string
): Promise<ExplorerContract | null> {
  const chain = getChain(chainId);
  if (!chain) return null;

  const contract = await fetchFromBlockscout(chain.explorerApiUrl, address);
  if (contract) {
    contract.chain = chain.name;
  }
  return contract;
}
