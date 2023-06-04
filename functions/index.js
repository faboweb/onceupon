const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const {
  SigningCosmWasmClient,
  Secp256k1HdWallet,
  CosmWasmClient,
  toUtf8,
  calculateFee,
} = require("cosmwasm");
const { GasPrice } = require("@cosmjs/stargate");
const { stringToPath, sha256 } = require("@cosmjs/crypto");
const sendTweet = require("./twitter");
const { loadNft } = require("./stargaze");
const { File, Web3Storage } = require("web3.storage");
const { MsgExecuteContract } = require("cosmjs-types/cosmwasm/wasm/v1/tx");

global.fetch = require("node-fetch"); // needed by stargaze

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const rpc = "https://rpc.stargaze-apis.com";
const walletOptions = {
  hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
  prefix: "stars",
};

const adminSigningClient = async (network) => {
  const signer = await Secp256k1HdWallet.fromMnemonic(
    network.mnemonic,
    walletOptions
  );

  const defaultGasPrice = GasPrice.fromString("0.5ustars");

  const signingClient = await SigningCosmWasmClient.connectWithSigner(
    rpc,
    signer,
    {
      broadcastPollIntervalMs: 300,
      broadcastTimeoutMs: 8_000,
      gasPrice: defaultGasPrice,
    }
  );
  return signingClient;
};

const executeAdmin = async (command) => {
  const signingClient = await adminSigningClient();
  const res = await signingClient.execute(
    process.env.ADDRESS,
    process.env.CONTRACT,
    command,
    "auto"
  );

  return res;
};

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

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const cycle = async () => {
  const res = await executeAdmin({ cycle: {} });
  return res;
};
exports.scheduledCycle = functions
  .runWith({
    timeoutSeconds: 300,
  })
  .pubsub.schedule("every day 00:00")
  .onRun(async (context) => {
    cycle();
  });
exports.cycle = functions
  .runWith({
    timeoutSeconds: 300,
  })
  .https.onRequest(async (req, res) => {
    const response = await cycle();
    res.status(200).send(response);
  });

exports.scheduleCheckNewSections = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .pubsub.schedule("every hour")
  .onRun(async (context) => {
    await checkNewSections();
  });

exports.checkNewSectionsTrigger = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .https.onRequest(async (req, res) => {
    const response = await checkNewSections();
    res.status(200).send(response);
  });

async function tweet(text, image) {
  const docSnap = await db.doc("functions/tweeter").get();
  const cookies = docSnap.data()?.cookies;
  const new_cookies = await sendTweet(
    text,
    image,
    cookies ? JSON.parse(cookies) : null
  );
  await db.doc("functions/tweeter").set(
    {
      cookies: new_cookies,
    },
    {
      merge: true,
    }
  );
}

async function checkNewSections() {
  const client = await CosmWasmClient.connect(rpc);

  const docSnap = await db.doc("functions/sections_last_check").get();
  const lastCheck = docSnap.data()?.block || 0;
  const block = await client.getBlock();
  const sections = await client.queryContractSmart(
    process.env.CONTRACT,
    {
      get_new_sections: {
        after: lastCheck,
      },
    },
    "auto"
  );

  console.log(lastCheck, sections);

  await Promise.all(
    sections.map(async (section) => {
      const header = `New chapter!\n\n`;
      const link = `https://onceupon.community/story/${section.story_id}/read`;
      const footer = `\n\nRead more at ${link}`;
      const text =
        header + section.content.substr(0, 280 - 94) + "..." + footer;

      const token = section.nft ? await loadNft(section.nft) : null;
      const imageUrl = token ? token.media.image.jpgLink : null;
      await tweet(text, imageUrl);
    })
  );

  await db.doc("functions/sections_last_check").set({
    block: block.header.height,
  });
}

exports.web3upload = onRequest(
  { timeoutSeconds: 15, cors: true, maxInstances: 10 },
  async (req, res) => {
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
  }
);

exports.resolveCIDs = onRequest(
  { timeoutSeconds: 15, cors: true, maxInstances: 10 },
  async (req, res) => {
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
  }
);

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

exports.executeWeb2 = onRequest(
  { timeoutSeconds: 30, cors: true, maxInstances: 10 },
  async (req, res) => {
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
      rpc,
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

    // // we will create a signed tx, that then is sent from the client to not extend the execution of this function

    // const signingClient = await SigningCosmWasmClient.connectWithSigner(
    //   rpc,
    //   wallet,
    //   {
    //     broadcastPollIntervalMs: 300,
    //     broadcastTimeoutMs: 8_000,
    //     gasPrice: defaultGasPrice,
    //   }
    // );

    // const msgs = [
    //   {
    //     typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    //     value: MsgExecuteContract.fromPartial({
    //       sender: address,
    //       contract: network.contract,
    //       msg: toUtf8(JSON.stringify({ [req.body.command]: req.body.data })),
    //       funds: [],
    //     }),
    //   },
    // ];

    // const gasEstimation = await signingClient.simulate(address, msgs, "");
    // const fee = calculateFee(Math.round(gasEstimation * 1.7), defaultGasPrice);

    // const txRaw = await signingClient.sign(address, msgs, fee, "");

    // res.status(200).send(txRaw);
  }
);

// exports.resolveNames = onRequest(
//   { timeoutSeconds: 15, cors: true, maxInstances: 10 },
//   async (req, res) => {
//     const addresses = req.body.addresses || [];
//     const usersSnaps = await db.collection("users").where("address", "in", addresses).get();
//     const users = usersSnaps.docs.map((doc) => doc.data());
//     const addressToUser = Object.fromEntries(users.map((user) => [user.address, user.name]));
// });
