const express = require("express");
const {
  SigningCosmWasmClient,
  Secp256k1HdWallet,
  CosmWasmClient,
} = require("cosmwasm");
const { GasPrice } = require("@cosmjs/stargate");
const { stringToPath, sha256 } = require("@cosmjs/crypto");
const { File, Web3Storage } = require("web3.storage");
const { verifyArbitrary } = require("@keplr-wallet/cosmos");
var cors = require("cors");
const debounce = require("lodash.debounce");

// global.fetch = require("node-fetch"); // needed by stargaze

const admin = require("firebase-admin");

// TODO put in config file
const networks = {
  // mainnet: {
  //   id: "mainnet",
  //   contract:
  //     "stars1eh58m7augmf7777k0kcgxwetse3tnsa6n7kwn458lfdv0zzknu2sgde4kq",
  //   admin: "stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv",
  //   url: "https://rpc-stargaze.pupmos.network",
  //   mnemonic: process.env.MNEMONIC_MAINNET,
  // },
  testnet: {
    id: "testnet",
    contract:
      "stars1j64pe4hsr6ptmleapqnax7fdl39a0nw0dwayvgz0d7cmkaezyuzst0n7us",
    admin: "stars17cv7tkzteht4pxggrgf3jynstsasdf8pv07d3z",
    url: "https://rpc.elgafar-1.stargaze-apis.com",
    mnemonic: process.env.MNEMONIC,
  },
};

// Create an instance of express
const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

const port = process.env.PORT || 3000;

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

app.get("/story/:id", async (req, res) => {
  const network = getNetwork(req);
  const storyId = req.params.id;
  const story = await db
    .collection("networks/" + network.id + "/stories")
    .doc(storyId)
    .get();
  if (!story.exists) {
    res.status(404).send("Story not found");
    return;
  }
  const storyData = story.data();
  const sections = await db
    .collection("networks/" + network.id + "/sections")
    .where("story_id", "==", storyId)
    .get();
  const sectionData = sections.docs.map((doc) => doc.data());

  const lastSectionBlock = await getBlock(network, story.last_cycle);
  const currentBlock = await getBlock(network); // TODO take last?
  const heightDiff = currentBlock?.header.height - story.last_cycle;
  const timeDiff =
    new Date(currentBlock?.header.time).getTime() -
    new Date(lastSectionBlock.header.time).getTime();
  const assumedNextSectionBlockTime = new Date(
    new Date(lastSectionBlock.header.time).getTime() +
      (timeDiff / heightDiff) * story.interval
  );

  res.status(200).send({
    ...storyData,
    assumedNextSectionBlockTime,
    sections: sectionData,
  });
});

app.get("/contributions/:user", async (req, res) => {
  try {
    const network = getNetwork(req);
    const body = req.body || {};
    const user = req.params.user;
    const userStories = await db
      .collection("networks/" + network.id + "/sections")
      .where("proposer", "==", user)
      .get();
    const sections = userStories.docs.map((doc) => doc.data());
    res.status(200).send(sections);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get("/author/:address", async (req, res) => {
  const network = getNetwork(req);
  const shares = await db
    .collection("networks/" + network.id + "/shares")
    .where("user", "==", req.params.address)
    .get();
  const authorShares = shares.docs
    .map((doc) => doc.data())
    .reduce(
      (acc, curr) => {
        acc.shares += curr.amount;
        acc.stories += 1;
        return acc;
      },
      {
        shares: 0,
        stories: 0,
      }
    );
  res.status(200).send(authorShares);
});

app.get("/authors", async (req, res) => {
  const network = getNetwork(req);
  const { limit } = req.query;
  const shares = await db
    .collection("networks/" + network.id + "/shares")
    .get();
  const sharesDict = shares.docs
    .map((doc) => doc.data())
    .reduce((acc, curr) => {
      if (!acc[curr.user]) {
        acc[curr.user] = {
          user: curr.user,
          shares: 0,
          stories: 0,
        };
      }
      acc[curr.user].shares += curr.amount;
      acc[curr.user].stories += 1;
      return acc;
    }, {});
  let authors = Object.values(sharesDict).sort((a, b) => b.shares - a.shares);
  if (limit) {
    authors = authors.slice(0, limit);
  }
  res.status(200).send(authors);
});

app.get("/stories", async (req, res) => {
  const body = req.body || {};
  let { limit } = req.query;
  const network = getNetwork(req);
  const shares = await db
    .collection("networks/" + network.id + "/shares")
    .get();
  const sharesDict = shares.docs
    .map((doc) => doc.data())
    .reduce((acc, curr) => {
      if (!acc[curr.storyId]) {
        acc[curr.storyId] = {
          storyId: curr.storyId,
          shares: 0,
        };
      }
      acc[curr.storyId].shares += curr.amount;
      return acc;
    }, {});
  const storyIds = Object.values(sharesDict);
  const stories = await db
    .collection("networks/" + network.id + "/stories")
    .get();
  let topStories = stories.docs
    .map((doc) => doc.data())
    .filter((story) => storyIds.find((_s) => _s.storyId === story.id))
    .map((story) => {
      return {
        ...story,
        shares: sharesDict[story.id].shares,
      };
    })
    .sort((a, b) => b.shares - a.shares);
  if (limit) {
    topStories = topStories.slice(0, limit);
  }

  return res.status(200).send(topStories);
});

const DEBOUNCE = 1000;
const subscribeTxs = async (network, cb) => {
  const debouncedIndex = debounce(async (height) => {
    index(network, height);
  }, DEBOUNCE);
  try {
    subscribe(network, (height) => {
      debouncedIndex(height);
    });
  } catch (err) {
    console.error(err);
  }
};

const index = async (network, height) => {
  console.log("Indexing");
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

  const batch = db.batch();
  await Promise.all(
    stories.map(async (story) => {
      const doc = db.doc("networks/" + network.id + "/stories/" + story.id);
      const sections = story.sections;
      delete story.sections;
      batch.set(
        doc,
        {
          ...story,
          first_section: sections[0],
          last_section: sections[sections.length - 1],
          sections: sections.length,
          owners: shares.filter(({ story_id }) => story_id === story.id).length,
          proposals: proposals.filter(({ story_id }) => story_id === story.id)
            .length,
          shares: shares
            .filter(({ story_id }) => story_id === story.id)
            .reduce((acc, curr) => acc + curr.amount, 0),
          lastUpdate: (await getBlock(network, story.last_cycle)).header.time,
          top_nfts: Object.entries(
            sections.reduce((acc, curr) => {
              if (curr.nft) {
                acc[curr.nft.contract_address + "_" + curr.nft.token_id] =
                  (acc[curr.nft.contract_address + "_" + curr.nft.token_id] ||
                    0) + 1;
              }
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([nft, count]) => {
              const [contract_address, token_id] = nft.split("_");
              return {
                contract_address,
                token_id,
                count,
              };
            }),
        },
        { merge: true }
      );

      // TODO optimize
      sections.forEach((section) =>
        batch.set(
          db.doc("networks/" + network.id + "/sections/" + section.section_id),
          section,
          { merge: true }
        )
      );
    })
  );

  shares.map(([storyId, user, amount]) => {
    const doc = db.doc("networks/" + network.id + "/shares/" + user);
    batch.set(
      doc,
      {
        user,
        storyId,
        amount,
      },
      { merge: true }
    );
  });

  await batch.commit();

  console.log("Indexing done");
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

Object.values(networks).forEach(async (network) => {
  try {
    const client = await CosmWasmClient.connect(network.url);
    const block = await client.getBlock();
    await index(network, block.header.height);
    // setInterval(async () => {
    //   const block = await client.getBlock();
    //   index(network, block.header.height);
    // }, 1000 * 60 * 60 * 1); // every hour
    subscribeTxs(network, async (event) => {
      const block = await client.getBlock();
      // TODO get heigth from event
      index(network, block.header.height);
    });

    cycle(network);
    setInterval(async () => {
      cycle(network);
    }, 1000 * 60 * 60 * 24);
  } catch (err) {
    console.error(err);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

var serviceAccount = require("../serviceAccountKey.json");
const { subscribe } = require("./websocket");
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
