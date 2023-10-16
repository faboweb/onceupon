const {
  getBlock,
  getState,
  executeMnemonic,
  executeAdmin,
} = require("./cosmos");
const { db } = require("./firebase");
const { summarize, createSections } = require("./llm");
const networks = require("./networks");
const { subscribe } = require("./websocket");
const debounce = require("lodash.debounce");
const { generateUUID } = require("./scripts/guid");
const { web3Uplodad } = require("./web3storage");
const { sendNotification } = require("./notifications");
const { getName, getNames } = require("./stargaze");

Object.values(networks).forEach(async (network) => {
  try {
    const block = await getBlock(network);
    await index(network, block.header.height);
    checkUpdatesAndNotify(network);
    // setInterval(async () => {
    //   const block = await client.getBlock();
    //   index(network, block.header.height);
    // }, 1000 * 60 * 60 * 1); // every hour
    subscribeTxs(network, async (event) => {
      const block = await getBlock(network);
      // TODO get heigth from event
      await index(network, block.header.height).catch(console.error);
      checkUpdatesAndNotify(network);
    });

    await cycle(network);
    setInterval(async () => {
      cycle(network).catch(console.error);
    }, 1000 * 60 * 60 * 24);
  } catch (err) {
    console.error(err);
  }
});

const DEBOUNCE = 1000;
const subscribeTxs = async (network, cb) => {
  const debouncedIndex = debounce(async (height) => {
    try {
      await index(network, height);
      checkUpdatesAndNotify(network);
    } catch (err) {
      console.error(err);
    }
  }, DEBOUNCE);
  try {
    subscribe(network, (height) => {
      debouncedIndex(height);
    });
  } catch (err) {
    console.error(err);
  }
};

const cycle = async (network) => {
  const block = await getBlock(network);
  const height = block.header.height;

  const stories = await (
    await db.collection("networks/" + network.id + "/stories").get()
  ).docs.map((doc) => doc.data());
  const cycleNeeded = stories.find((story) => {
    return story.last_cycle + story.interval <= height;
  });

  if (cycleNeeded) {
    console.log("Triggering cycle");
    try {
      await executeAdmin(
        network,
        {
          cycle: {},
        },
        false
      );
      console.log("Done cycle");
      await index(network, height);
    } catch (err) {
      console.error("Cycle failed");
      console.error(err);
    }
  }
};

const index = async (network) => {
  console.log("Indexing", network.id);
  const { stories, shares, proposals, votes } = await getState(network);

  const likes = await db.collection("networks/" + network.id + "/likes").get();
  const likesData = likes.docs.map((doc) => doc.data());

  const existingSectionIds = (
    await db.collection("networks/" + network.id + "/sections").get()
  ).docs.map((doc) => doc.id);

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
          owners: shares.filter(([story_id]) => story_id === story.id).length,
          proposals: proposals.filter(({ story_id }) => story_id === story.id)
            .length,
          shares: shares
            .filter(([storyId]) => storyId === story.id)
            .reduce((acc, [storyId, userId, amount]) => acc + amount, 0),
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
          likes: likesData.filter(({ story_id }) => story_id === story.id)
            .length,
        },
        { merge: true }
      );

      const updatedStories = new Set();

      // TODO optimize
      await Promise.all(
        sections
          .filter((s) => !existingSectionIds.includes(s.section_id))
          .map(async (section) => {
            const { content } = (
              await db.doc("content/" + section.content_cid).get()
            ).data();
            const summary = await summarize(content);

            batch.set(
              db.doc(
                "networks/" + network.id + "/sections/" + section.section_id
              ),
              { ...section, summary },
              { merge: true }
            );

            updatedStories.add(section.story_id);
          })
      );
    })
  );

  const existingProposals = await db
    .collection("networks/" + network.id + "/proposals")
    .get();
  const existingProposalIds = existingProposals.docs.map((doc) => doc.id);
  proposals
    .filter(({ section_id }) => !existingProposalIds.includes(section_id))
    .map((proposal) => {
      const doc = db.doc(
        "networks/" + network.id + "/proposals/" + proposal.section_id
      );
      batch.set(doc, proposal);
    });
  existingProposalIds
    .filter((id) => !proposals.find(({ section_id }) => section_id === id))
    .map((id) => {
      const doc = db.doc("networks/" + network.id + "/proposals/" + id);
      batch.delete(doc);
    });

  const sharesDoc = db.collection("networks/" + network.id + "/shares2");
  shares.forEach(([storyId, user, amount]) => {
    batch.set(
      sharesDoc.doc(storyId + "_" + user),
      {
        storyId,
        user,
        amount,
      },
      { merge: true }
    );
  });

  const users = new Set(shares.map(([, user]) => user));
  const names = await getNames(network, Array.from(users));
  const namesDoc = db.collection("networks/" + network.id + "/names");
  Object.entries(names).forEach(([address, nameRecord]) => {
    if (!nameRecord) return;
    const record = nameRecord.media
      ? {
          name: nameRecord.name,
          image: nameRecord.media?.url,
        }
      : {
          name: nameRecord.name,
        };
    batch.set(namesDoc.doc(address), record, { merge: true });
  });

  await batch.commit();

  console.log("Indexing done");

  console.log("Checking to add bot sections");
  await addBotSection(network);
  console.log("Bot sections done");
};

async function checkUpdatesAndNotify(network) {
  const networkState = db.doc("networks/" + network.id);
  const docSnap = await networkState.get();
  const lastCheck = docSnap.data()?.last_check || 0;
  const block = await getBlock(network);
  const newSections = await db
    .collection("networks/" + network.id + "/sections")
    .where("added", ">", lastCheck)
    .get();
  const newSectionsData = newSections.docs.map((doc) => doc.data());
  newSectionsData.forEach(async (section) => {
    const header = `New chapter proposal!\n\n`;
    const link = `https://app.onceupon.community/story/${section.story_id}/read`;
    const content = (
      await db.doc("content/" + section.content_cid).get()
    ).data();
    const message = `${header} ${content} \n\n ${link}`;
    await sendNotification(
      network,
      section.story_id,
      message,
      "New chapter proposal!",
      {
        storyId: section.story_id,
        type: "proposal",
      }
    );
  });

  const newStories = await db
    .collection("networks/" + network.id + "/stories")
    .where("created", ">", lastCheck)
    .get();
  const newStoriesData = newStories.docs.map((doc) => doc.data());

  newStoriesData.forEach(async (story) => {
    // const content = (
    //   await db.doc("content/" + story.first_section.content_cid).get()
    // ).data();
    const message = story.name;
    await sendNotification(network, "new_story", message, "New story!", {
      storyId: story.id,
      type: "story",
    });

    const userForAddressDocs = await db
      .collection("users")
      .where("address", "==", story.creator)
      .get();
    if (userForAddressDocs.docs.length > 0) {
      const user = userForAddressDocs.docs[0].data();
      registerUserWithTopic(user.uid, story_id);
    }
  });

  await networkState.set(
    {
      last_check: block.header.height,
    },
    {
      merge: true,
    }
  );
}

async function addBotSection(network) {
  const botAddress = network.admin;
  const storyIds = await db
    .collection("networks/" + network.id + "/stories")
    .get();
  const storyIdsData = storyIds.docs
    .map((doc) => doc.data())
    .map(({ id }) => id);
  const proposals = await db
    .collection("networks/" + network.id + "/proposals")
    .get();
  const proposalsData = proposals.docs.map((doc) => doc.data());
  const storiesWithoutBotProposal = storyIdsData.filter((storyId) => {
    const botProposals = proposalsData.filter(
      ({ story_id, proposer }) =>
        story_id === storyId && proposer === botAddress
    );
    return botProposals.length < 2;
  });
  // TODO to parallelize need to handle sequence number
  for (let storyId of storiesWithoutBotProposal) {
    const botProposals = proposalsData.filter(
      ({ story_id, proposer }) =>
        story_id === storyId && proposer === botAddress
    );
    let sections = await createSections(network, storyId);
    // DEPR temporary until bot always creates two
    if (botProposals.length === 1) {
      sections = sections.slice(1);
    }
    await Promise.all(
      sections.map(async (content) => {
        const cid = await web3Uplodad(content);

        await executeMnemonic(network.mnemonic, network, {
          new_story_section: {
            section: {
              story_id: storyId,
              section_id: generateUUID(),
              content_cid: cid,
              nft: null,
              proposer: null,
            },
          },
        });
      })
    );
  }
}

module.exports = {
  networks,
  index,
  checkUpdatesAndNotify,
  addBotSection,
};
