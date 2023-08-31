const express = require("express");
const {
  SigningCosmWasmClient,
  Secp256k1HdWallet,
  CosmWasmClient,
  toUtf8,
  calculateFee,
} = require("cosmwasm");
const { GasPrice } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const { stringToPath, sha256 } = require("@cosmjs/crypto");
// const sendTweet = require("./twitter");
// const { loadNft } = require("./stargaze");
const { File, Web3Storage } = require("web3.storage");
const { MsgExecuteContract } = require("cosmjs-types/cosmwasm/wasm/v1/tx");
const { verifyArbitrary } = require("@keplr-wallet/cosmos");
var cors = require("cors");
const debounce = require("lodash.debounce");

// global.fetch = require("node-fetch"); // needed by stargaze

const admin = require("firebase-admin");

// TODO put in config file
const networks = {
  mainnet: {
    id: "mainnet",
    contract:
      "stars1eh58m7augmf7777k0kcgxwetse3tnsa6n7kwn458lfdv0zzknu2sgde4kq",
    admin: "stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv",
    url: "https://rpc-stargaze.pupmos.network",
    mnemonic: process.env.MNEMONIC_MAINNET,
  },
  testnet: {
    id: "testnet",
    contract:
      "stars1j64pe4hsr6ptmleapqnax7fdl39a0nw0dwayvgz0d7cmkaezyuzst0n7us",
    admin: "stars1gxqu5nm55jqwnrzsachesczntqd0fd8xwd5nx8",
    url: "https://rpc.elgafar-1.stargaze-apis.com/",
    mnemonic: process.env.MNEMONIC,
  },
};

// Create an instance of express
const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

const port = process.env.PORT || 3000;

app.post("/web3upload", async (req, res) => {
  const body = req.body || {};
  const { content } = body;

  const hash = sha256(content).toString("hex");
  const existingUpload = await db.doc("contentHash/" + hash).get();
  if (existingUpload.exists) {
    res.status(200).send(existingUpload.data().cid);
    return;
  }

  const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });

  // uploads the file to web3.storage
  const file = new File([content], "section.txt", { type: "text/plain" });
  const cid = await client.put([file]);

  // store locally for easy access
  await db.doc("content/" + cid).set({
    content,
  });

  // store hash to avoid duplicates
  await db.doc("contentHash/" + hash).set({
    cid,
  });

  // returns the cid
  res.status(200).send(cid);
});

app.post("/resolveCIDs", async (req, res) => {
  const body = req.body || {};
  const { cids } = body;
  const docs = cids.map((cid) => db.doc("content/" + cid));
  const loadedDocs = await db.getAll(...docs);

  const cidLookup = Object.fromEntries(
    loadedDocs.map((doc) => {
      const data = doc.data();
      return [doc.id, data.content];
    })
  );

  // returns the cid
  res.status(200).send(cidLookup);
});

// app.get("/contributions", async (req, res) => {
//     const network = getNetwork(req);
//   const body = req.body || {};
//     const queryClient = await CosmWasmClient.connect(network.url);
//     const stories = await queryClient.queryContractSmart(
//       network.contract,
//       { get_stories: {} }
//     );
//     const

// app.get("/authors", async (req, res) => {
//     const network = getNetwork(req);
//   const body = req.body || {};
//     const queryClient = await CosmWasmClient.connect(network.url);
//     const stories = await queryClient.queryContractSmart(
//       network.contract,
//       { get_stories: {} }
//     );
//     const

// app.post("/stories", async (req, res) => {
//   const body = req.body || {};

//   const stories = await queryClient.queryContractSmart(
//     network.contract,
//     { get_stories: {} }
//   );
//   const cids = [];
//   await Promise.all(
//     stories.map(async (story) => {
//       story.top_nfts.forEach((nft) => nftStore.loadNft(nft));
//       const lastSectionBlock = await walletStore.getBlock(story.last_section);
//       const _story = this.stories?.find((s) => s.id === story.id);
//       _story.lastUpdate = lastSectionBlock?.header.time;
//       cids.push(_story.first_section_cid);
//       nameStore.getName(story.creator);
//     })
//   );
//   // returns the cid
//   res.status(200).send(cidLookup);
// });

// TODO polling to db
const getBlock = async (client) => {
  const block = await client.getBlock();
  return block;
};

let height = 0;
const pollHeight = async (client, network) => {
  if (!height) {
    const state = (
      await db.doc("networks/" + network.name + "/state").get()
    ).data();
    height = state.height;
  }
  const block = await client.getBlock();
  while (block.header.height > height) {
    height++;
    const blockForHeight =
      block.header.height === height ? block : await client.getBlock(height);
    await processBlock(blockForHeight);
    await db.doc("networks/" + network.name + "/state").set(
      {
        height,
      },
      {
        merge: true,
      }
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
  pollHeight(client, network);
};

const processBlock = async (client, network, block) => {
  const txs = client.searchTx(
    `tx.height=${block.header.height} AND message.action='/cosmwasm.wasm.v1.MsgExecuteContract' AND execute._contract_address='${network.address}'`
  );
};

const DEBOUNCE = 1000;
const subscribeTxs = async (network, cb) => {
  const tendermintClient = await Tendermint34Client.connect(
    network.url.replace("https://", "")
  );
  const txStream = tendermintClient.subscribeTx(
    `message.action='/cosmwasm.wasm.v1.MsgExecuteContract' AND execute._contract_address='${network.address}'`
  );
  // const debouncedCb = debounce(cb, DEBOUNCE);

  txStream.subscribe((event) => {
    console.log(event);
  });
};

Object.values(networks).forEach(async (network) => {
  try {
    await subscribeTxs(network, async (event) => {
      index(network);
    });
  } catch (err) {
    console.error(err);
  }
});

const index = async (network) => {
  const { stories, shares, sections, votes } =
    await queryClient.queryContractSmart(
      network.contract,
      { get_state: {} },
      "block"
    );

  const storyDocs = stories.map((story) => {
    const doc = db.doc("networks/" + network.id + "/stories/" + story.id);
    return doc.set(story, { merge: true });
  });
  await Promise.all(storyDocs);

  const shareDocs = shares.map(([storyId, user, amount]) => {
    const doc = db.doc("networks/" + network.id + "/shares/" + user);
    return doc.set(
      {
        user,
        storyId,
        amount,
      },
      { merge: true }
    );
  });
  await Promise.all(shareDocs);
};

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

var serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const auth = admin.auth();

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

app.get("/web2Address", async (req, res) => {
  try {
    const idToken = await getToken(req);
    const user = await admin.auth().verifyIdToken(idToken);
    const network = getNetwork(req);

    const { address } = await getWallet(user, network);

    res.status(200).send({
      address,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

const fundAccount = async (user, network) => {
  const { address } = await getWallet(user, network);
  const adminSigningClient = await adminSigningClient(network);
  const balance = await adminSigningClient.getBalance(address);

  if (balance.amount === 0) {
    // send 1ustars to the new account to create it
    await adminSigningClient.sendTokens(
      network.admin,
      address,
      [{ denom: "ustars", amount: "1" }],
      {
        amount: [{ denom: "ustars", amount: "0" }],
        gas: "200000",
      }
    );

    await db.doc("users/" + user.uid).set(
      {
        funded: true,
      },
      {
        merge: true,
      }
    );
  }
};

app.post("/executeWeb2", async (req, res) => {
  try {
    const idToken = await getToken(req);
    const user = await admin.auth().verifyIdToken(idToken);
    const network = getNetwork(req);

    await fundAccount(user, network);

    const defaultGasPrice = GasPrice.fromString("0ustars");

    const signingClient = await SigningCosmWasmClient.connectWithSigner(
      network.url,
      wallet,
      {
        broadcastPollIntervalMs: 300,
        broadcastTimeoutMs: 8_000,
        gasPrice: defaultGasPrice,
      }
    );

    const result = await signingClient.execute(
      address,
      network.contract,
      {
        [req.body.command]: req.body.data,
      },
      "auto"
    );

    res.status(200).send(result.txHash);
  } catch (err) {
    res.status(400).send(err.message);
    console.error(err);
  }
});

app.get("/web3Auth", async (req, res) => {
  const body = req.body || {};
  const {
    chainId,
    signer,
    data, // base64
    signature,
  } = body;
  const verified = await verifyArbitrary(
    chainId,
    signer,
    Buffer.from(data, "base64"),
    signature
  );
  if (!verified) {
    res.status(401).send("Unauthorized");
    return;
  }
  const customToken = await auth.createCustomToken(signer);

  res.status(200).send(customToken);
});

function getToken(request) {
  if (!request.headers.authorization) {
    return undefined;
  }

  const token = request.headers.authorization.replace(/^Bearer\s/, "");

  return token;
}

function getNetwork(request) {
  if (!request.headers["x-network"]) {
    return networks.mainnet;
  }
  const networkId = request.headers["x-network"];
  if (!networks[networkId]) {
    throw new Error("invalid network");
  }
  return networks[networkId];
}
