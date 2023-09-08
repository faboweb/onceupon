const { getBlock, getState, cycle } = require("./cosmos");
const { db } = require("./firebase");
const networks = require("./networks");
const { subscribe } = require("./websocket");
const debounce = require("lodash.debounce");

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

  // sendNotification("test", "test", "test", {
  //   storyId: "test",
  //   type: "story",
  // });
});

const DEBOUNCE = 1000;
const subscribeTxs = async (network, cb) => {
  const debouncedIndex = debounce(async (height) => {
    await index(network, height);
    checkUpdatesAndNotify(network);
  }, DEBOUNCE);
  try {
    subscribe(network, (height) => {
      debouncedIndex(height);
    });
  } catch (err) {
    console.error(err);
  }
};

const index = async (network) => {
  console.log("Indexing");
  const { stories, shares, proposals, votes } = await getState(network);

  const likes = await db.collection("networks/" + network.id + "/likes").get();
  const likesData = likes.docs.map((doc) => doc.data());

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
    const link = `https://onceupon.community/story/${section.story_id}/read`;
    const content = (
      await db.doc("content/" + section.content_cid).get()
    ).data();
    const message = `${header} ${content} \n\n ${link}`;
    await sendNotification(section.story_id, message, "New chapter proposal!", {
      storyId,
      type: "proposal",
    });
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
    const message = story.title;
    await sendNotification("new_story", message, "New story!", {
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

module.exports = {
  networks,
  index,
  checkUpdatesAndNotify,
};
