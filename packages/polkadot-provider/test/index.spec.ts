import "mocha";
import { expect } from "chai";

import { SIGNER_EVENTS } from "@walletconnect/signer-connection";
import { Client, CLIENT_EVENTS } from "@walletconnect/client";
import { SessionTypes } from "@walletconnect/types";

import PolkadotProvider from "./../src/index";

const NAMESPACE = "polkadot";
const CHAIN_ID = "b0a8d493285c2df73290dfb7e61f870f";
const RPC_URL = `https://kusama-rpc.polkadot.io/`;

const TEST_CHAINS = [CHAIN_ID];

const TEST_POLKADOT_ADDRESS = "5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy";

export const TEST_RELAY_URL = process.env.TEST_RELAY_URL
  ? process.env.TEST_RELAY_URL
  : "ws://localhost:5555";

const TEST_APP_METADATA = {
  name: "Test App",
  description: "Test App for WalletConnect",
  url: "https://walletconnect.org/",
  icons: ["https://walletconnect.org/walletconnect-logo.png"],
};

const TEST_WALLET_METADATA = {
  name: "Test Wallet",
  description: "Test Wallet for WalletConnect",
  url: "https://walletconnect.org/",
  icons: ["https://walletconnect.org/walletconnect-logo.png"],
};

describe("@walletconnect/polkadot-provider", () => {
  it("Test connect and sign", async () => {
    const wallet = { address: TEST_POLKADOT_ADDRESS };
    const walletClient = await Client.init({
      controller: true,
      relayProvider: TEST_RELAY_URL,
      metadata: TEST_WALLET_METADATA,
    });
    const provider = new PolkadotProvider({
      chains: TEST_CHAINS,
      rpc: {
        custom: {
          [CHAIN_ID]: RPC_URL,
        },
      },
      client: {
        relayProvider: TEST_RELAY_URL,
        metadata: TEST_APP_METADATA,
      },
    });

    // auto-pair
    provider.signer.connection.on(SIGNER_EVENTS.uri, ({ uri }) => walletClient.pair({ uri }));
    // connect
    let accounts: string[] = [];
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        walletClient.on(CLIENT_EVENTS.session.proposal, async (proposal: SessionTypes.Proposal) => {
          const response = {
            state: { accounts: [`${TEST_POLKADOT_ADDRESS}@${NAMESPACE}:${CHAIN_ID}`] },
          };
          await walletClient.approve({
            proposal,
            response,
          });
          resolve();
        });
      }),
      new Promise<void>(async (resolve, reject) => {
        await provider.connect();
        accounts = provider.accounts;
        resolve();
      }),
    ]);
    expect(accounts[0].split("@")[0]).to.eql(wallet.address);
  });
});
