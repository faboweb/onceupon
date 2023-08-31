import { GasPrice, SigningCosmWasmClient } from "cosmwasm";

export const connectKeplr = async (network) => {
  const chainId = network.chainId;
  // Enabling before using the Keplr is recommended.
  // This method will ask the user whether or not to allow access if they haven't visited this website.
  // Also, it will request user to unlock the wallet if the wallet is locked.
  // @ts-ignore
  await window.keplr.enable(chainId);

  // @ts-ignore
  const offlineSigner = window.getOfflineSigner(chainId);

  // You can get the address/public keys by `getAccounts` method.
  // It can return the array of address/public key.
  // But, currently, Keplr extension manages only one address/public key pair.
  // XXX: This line is needed to set the sender address for SigningCosmosClient.
  const accounts = await offlineSigner.getAccounts();

  const defaultGasPrice = GasPrice.fromString("1ustars");

  // Initialize the gaia api with the offline signer that is injected by Keplr extension.
  const signingClient = await SigningCosmWasmClient.connectWithSigner(
    network.url,
    offlineSigner,
    {
      broadcastPollIntervalMs: 300,
      broadcastTimeoutMs: 8_000,
      gasPrice: defaultGasPrice,
    }
  );
  return {
    client: signingClient,
    address: accounts[0].address,
    name: accounts[0].name,
  };
};
