const express = require("express");
const { verifyADR36Amino } = require("@keplr-wallet/cosmos");
const amino = require("@cosmjs/amino");
var cors = require("cors");
var crypto = require("crypto");
const { db, auth, getUser } = require("./firebase");
const { getBlock, execute, conditionalFundAccount } = require("./cosmos");
const networks = require("./networks");
const { web3Uplodad } = require("./web3storage");
require("./logic");

// global.fetch = require("node-fetch"); // needed by stargaze

// Create an instance of express
const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

const port = process.env.PORT || 3000;

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

app.post("/web3upload", async (req, res) => {
  const body = req.body || {};
  const { content } = body;

  const cid = await web3Uplodad(content);

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
  try {
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

    const lastSectionBlock = await getBlock(network, storyData.last_cycle);
    const currentBlock = await getBlock(network); // TODO take last?
    const heightDiff = currentBlock?.header.height - storyData.last_cycle;
    const timeDiff =
      new Date(currentBlock?.header.time).getTime() -
      new Date(lastSectionBlock.header.time).getTime();
    const assumedNextSectionBlockTime = new Date(
      new Date(lastSectionBlock.header.time).getTime() +
        (timeDiff / heightDiff) * storyData.interval
    );

    const likes = await db
      .collection("networks/" + network.id + "/likes")
      .where("story_id", "==", storyId)
      .get();
    const likesData = likes.docs.map((doc) => doc.data());

    res.status(200).send({
      ...storyData,
      assumedNextSectionBlockTime,
      sections: sectionData,
      likes: likesData.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
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
  // const storyIds = Object.values(sharesDict);
  const stories = await db
    .collection("networks/" + network.id + "/stories")
    .get();
  let topStories = stories.docs
    .map((doc) => doc.data())
    // .filter((story) => storyIds.find((_s) => _s.storyId === story.id))
    .map((story) => {
      return {
        ...story,
        shares: sharesDict[story.id]?.shares || 0,
      };
    })
    .sort((a, b) => b.shares - a.shares);
  if (limit) {
    topStories = topStories.slice(0, limit);
  }

  return res.status(200).send(topStories);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/web2Address", async (req, res) => {
  try {
    const user = await getUser(req);
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

app.post("/executeWeb2", async (req, res) => {
  try {
    const user = await getUser(req);
    const network = getNetwork(req);

    // TODO bake into execute
    await conditionalFundAccount(user, network);

    const result = await execute(user, network, {
      [req.body.command]: req.body.data,
    });

    res.status(200).send(result.txHash);
  } catch (err) {
    res.status(400).send(err.message);
    console.error(err);
  }
});

app.post("/web3AuthNonce", async (req, res) => {
  const body = req.body || {};
  const { address } = body;
  const nonce = (Math.random() + 1).toString(36).substring(7);
  await db.doc("/nonces/" + address).set({
    nonce,
    address,
  });
  res.send(nonce).status(200);
});

app.post("/web3Auth", async (req, res) => {
  const network = getNetwork(req);
  const body = req.body || {};
  const { address, signature } = body;

  const { nonce } = (await db.doc("/nonces/" + address).get()).data();
  const data = JSON.stringify({
    message: "Signing into OnceUpon",
    nonce,
  });

  const { pubkey: decodedPubKey, signature: decodedSignature } =
    amino.decodeSignature(signature);

  let verified = false;
  try {
    verified = verifyADR36Amino(
      "stars",
      address,
      data,
      decodedPubKey,
      decodedSignature
    );
  } catch (err) {
    console.error(err);
  }
  if (!verified) {
    res.status(403).send("Unauthorized");
    return;
  }
  const customToken = await auth.createCustomToken(address);

  res.status(200).send(customToken);
});

const getUserAddress = async (user) => {
  if (user.firebase.sign_in_provider === "custom") {
    return user.uid;
  }
  const walletPath = "users/" + user.uid + "/networks/" + network.id;
  const { address } = (await db.doc(walletPath).get()).data();
  return address;
};

app.post("/like", async (req, res) => {
  try {
    const user = await getUser(req);
    const network = getNetwork(req);

    const body = req.body || {};
    const { story_id, section_id } = body;
    const key = story_id + section_id + user.uid;

    // TODO add address as claim
    const address = await getUserAddress(user);

    const hash = crypto.createHash("md5").update(key).digest("hex");
    const like = db.collection("networks/" + network.id + "/likes").doc(hash);
    if ((await like.get()).exists) {
      await like.delete();
    } else {
      await like.set({
        address,
        story_id: story_id,
        section_id: section_id,
      });
      registerUserWithTopic(user.uid, story_id);
      registerUserWithTopic(user.uid, section_id);
    }
    res.status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get("/likes/:address", async (req, res) => {
  const network = getNetwork(req);

  const address = req.params.address;
  const likes = await db
    .collection("networks/" + network.id + "/likes")
    .where("address", "==", address)
    .get();
  const result = [];
  likes.forEach((like) => {
    result.push(like.data());
  });
  res.status(200).send(result);
});

app.get("/nfts/:address", async (req, res) => {
  const network = getNetwork(req);

  const address = req.params.address;
  const sections = await db
    .collection("networks/" + network.id + "/sections")
    .where("proposer", "==", address)
    .get();
  const result = [];
  sections.forEach((section) => {
    const data = section.data();
    if (data.nft) result.push(data.nft);
  });
  res.status(200).send(result);
});

app.post("/registerPushToken", async (req, res) => {
  const user = await getUser(req);

  const body = req.body || {};
  const { token } = body;

  await db.doc("users/" + user.uid).set(
    {
      pushToken: token,
    },
    {
      merge: true,
    }
  );

  await db
    .collection("pushTopics")
    .where("userUid", "==", user.uid)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        doc.ref.set(
          {
            pushToken: token,
          },
          {
            merge: true,
          }
        );
      });
    });

  res.status(200).send();
});
