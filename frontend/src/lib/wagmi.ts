import { http, createConfig } from "wagmi";
import { polkadotHubTestnet, polkadotHubMainnet } from "./chains";

export const wagmiConfig = createConfig({
  chains: [polkadotHubTestnet, polkadotHubMainnet],
  transports: {
    [polkadotHubTestnet.id]: http(),
    [polkadotHubMainnet.id]: http(),
  },
});
