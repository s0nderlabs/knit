import type { PrivyClientConfig } from "@privy-io/react-auth";
import { polkadotHubTestnet, polkadotHubMainnet } from "./chains";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "google", "wallet"],
  appearance: {
    theme: "light",
    accentColor: "#242424",
    walletChainType: "ethereum-only",
    walletList: ["metamask", "coinbase_wallet", "rainbow", "wallet_connect"],
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: false,
  },
  defaultChain: polkadotHubTestnet,
  supportedChains: [polkadotHubTestnet, polkadotHubMainnet],
};
