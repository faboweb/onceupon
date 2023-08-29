const express = require("express");
const {
  SigningCosmWasmClient,
  Secp256k1HdWallet,
  CosmWasmClient,
  toUtf8,
  calculateFee,
} = require("cosmwasm");
const { GasPrice } = require("@cosmjs/stargate");
const { stringToPath, sha256 } = require("@cosmjs/crypto");
// const sendTweet = require("./twitter");
// const { loadNft } = require("./stargaze");
const { File, Web3Storage } = require("web3.storage");
const { MsgExecuteContract } = require("cosmjs-types/cosmwasm/wasm/v1/tx");
const { verifyArbitrary } = require("@keplr-wallet/cosmos");
var cors = require("cors");

// global.fetch = require("node-fetch"); // needed by stargaze

const admin = require("firebase-admin");

// TODO put in config file
const networks = {
  mainnet: {
    contract:
      "stars1eh58m7augmf7777k0kcgxwetse3tnsa6n7kwn458lfdv0zzknu2sgde4kq",
    admin: "stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv",
    url: "https://rpc.stargaze-apis.com",
    mnemonic: process.env.MNEMONIC_MAINNET,
  },
  testnet: {
    contract:
      "stars1j64pe4hsr6ptmleapqnax7fdl39a0nw0dwayvgz0d7cmkaezyuzst0n7us",
    admin: "stars1gxqu5nm55jqwnrzsachesczntqd0fd8xwd5nx8",
    url: "https://rpc-testnet.stargaze-apis.com",
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

app.post("/executeWeb2", async (req, res) => {
  const idToken = await getToken(req);
  const user = await admin.auth().verifyIdToken(idToken);
  const network = getNetwork(req);

  const docSnap = await db.doc("users/" + user.uid).get();
  let mnemonic = docSnap.data()?.mnemonic;
  let wallet;
  let address;
  if (!mnemonic) {
    wallet = await Secp256k1HdWallet.generate(12, walletOptions);
    address = (await wallet.getAccounts())[0].address;
    mnemonic = wallet.mnemonic;

    await db.doc("users/" + user.uid).set({
      mnemonic: wallet.mnemonic,
      address,
    });

    const signingClient = await adminSigningClient(network);
    // send 1ustars to the new account to create it
    await signingClient.sendTokens(
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
  } else {
    wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);
    address = (await wallet.getAccounts())[0].address;
  }

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
