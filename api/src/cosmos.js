const { stringToPath } = require("@cosmjs/crypto");
const {
  CosmWasmClient,
  Secp256k1HdWallet,
  GasPrice,
  SigningCosmWasmClient,
} = require("cosmwasm");
const { db } = require("./firebase");

const clients = {};
const getClient = async (network) => {
  if (clients[network.id]) return clients[network.id];

  const queryClient = await CosmWasmClient.connect(network.url);
  clients[network.id] = queryClient;
  return queryClient;
};

const blocks = {};
const getBlock = async (network, height) => {
  const client = await getClient(network);

  let block;
  if (!height) {
    block = await client.getBlock();
    height = block.header.height;
  }
  if (blocks[height]) return blocks[height];

  block = await client.getBlock(height).catch((err) => {
    console.log(err);
    return undefined;
  });
  if (!block) return undefined;
  blocks[block.header.height] = block;
  return block;
};

const getState = async (network) => {
  const queryClient = await getClient(network);
  const {
    stories,
    shares,
    sections: proposals,
    votes,
  } = await queryClient.queryContractSmart(
    network.contract,
    { get_state: {} },
    "block"
  );
  return {
    stories,
    shares,
    proposals,
    votes,
  };
};

const cycle = async (network) => {
  const client = await adminSigningClient(network);
  const block = await client.getBlock();
  const height = block.header.height;

  const stories = await (
    await db.collection("networks/" + network.id + "/stories").get()
  ).docs.map((doc) => doc.data());
  const cycleNeeded = stories.find((story) => {
    return story.last_cycle + story.interval <= height;
  });

  if (cycleNeeded) {
    console.log("Triggering cycle");
    await client.execute(
      network.admin,
      network.contract,
      {
        cycle: {},
      },
      "auto"
    );
    console.log("Done cycle");
    await index(network, height);
  }
};

const conditionalFundAccount = async (user, network) => {
  const { address } = await getWallet(user, network);
  const client = await adminSigningClient(network);
  // const adminBalance = await client.getBalance(network.admin, "ustars");
  const balance = await client.getBalance(address, "ustars");

  if (Number(balance.amount) === 0) {
    await fundAccount(address, network);
  }
};

const fundAccount = async (address, network) => {
  const client = await adminSigningClient(network);

  // send 1ustars to the new account to create it
  const gas = 100000;
  await client.sendTokens(
    network.admin,
    address,
    [{ denom: "ustars", amount: "100000" }],
    {
      amount: [{ denom: "ustars", amount: "" + gas }],
      gas: "" + gas,
    }
  );

  while ((await client.getBalance(address, "ustars")).amount === "0") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const user = (
    await db.collection("users").where("address", "==", address).get()
  ).docs[0];
  if (user) {
    await db.doc("users/" + user.id).set(
      {
        funded: true,
      },
      {
        merge: true,
      }
    );
  }
};

const walletOptions = {
  hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
  prefix: "stars",
};

const adminSigningClient = async (network) => {
  const signer = await Secp256k1HdWallet.fromMnemonic(
    network.mnemonic,
    walletOptions
  );

  const defaultGasPrice = GasPrice.fromString("1ustars");

  const signingClient = await SigningCosmWasmClient.connectWithSigner(
    network.url,
    signer,
    {
      broadcastPollIntervalMs: 300,
      broadcastTimeoutMs: 8_000,
      gasPrice: defaultGasPrice,
    }
  );
  return signingClient;
};

const getWallet = async (user, network) => {
  const walletPath = "users/" + user.uid + "/networks/" + network.id;
  const docSnap = await db.doc(walletPath).get();
  let mnemonic = docSnap.data()?.mnemonic;
  let wallet;
  let address;
  if (!mnemonic) {
    wallet = await Secp256k1HdWallet.generate(12, walletOptions);
    address = (await wallet.getAccounts())[0].address;
    mnemonic = wallet.mnemonic;

    await db.doc(walletPath).set({
      mnemonic: wallet.mnemonic,
      address,
    });
  } else {
    wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);
    address = (await wallet.getAccounts())[0].address;
  }

  return {
    wallet,
    address,
  };
};

const executeWallet = async (
  { wallet, address },
  network,
  message,
  retry = false
) => {
  const defaultGasPrice = GasPrice.fromString("1ustars");

  const signingClient = await SigningCosmWasmClient.connectWithSigner(
    network.url,
    wallet,
    {
      broadcastPollIntervalMs: 300,
      broadcastTimeoutMs: 8_000,
      gasPrice: defaultGasPrice,
    }
  );

  try {
    const result = await signingClient.execute(
      address,
      network.contract,
      message,
      "auto"
    );
    return result;
  } catch (err) {
    if (retry) throw err;

    if (
      err.message.indexOf("insufficient funds") !== -1 ||
      err.message.indexOf("Account does not exist on chain") !== -1
    ) {
      await fundAccount(address, network);
      return await executeWallet({ wallet, address }, network, message, true);
    } else {
      throw err;
    }
  }
};

const execute = async (user, network, message, retry = false) => {
  const { wallet, address } = await getWallet(user, network);

  return await executeWallet({ wallet, address }, network, message, retry);
};

const executeMnemonic = async (mnemonic, network, message, retry = false) => {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);
  const address = (await wallet.getAccounts())[0].address;

  return await executeWallet({ wallet, address }, network, message, retry);
};

module.exports = {
  getClient,
  getWallet,

  getBlock,
  getState,
  cycle,

  conditionalFundAccount,
  fundAccount,
  execute,
  executeMnemonic,
};
