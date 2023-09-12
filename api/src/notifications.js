const { db, admin } = require("./firebase");

async function sendNotification(network, topic, message, title, data) {
  try {
    // write notification to db
    await db.collection("networks/" + network.id + "/notifications").add({
      topic,
      message,
      title,
      data,
      created: admin.firestore.FieldValue.serverTimestamp(),
    });

    const subscribedTokens = await db
      .collection("pushTopics")
      .where("topic", "==", topic)
      .get()
      .then((snapshot) => {
        const tokens = [];
        snapshot.forEach((doc) => {
          tokens.push(doc.data().pushToken);
        });
        return tokens;
      });
    await Promise.all(
      subscribedTokens.map(async (registrationToken) => {
        const payload = {
          token: registrationToken,
          data,
          notification: {
            title,
            body: message,
          },
        };
        await admin
          .messaging()
          .send(payload)
          .catch((err) => {
            removeToken(registrationToken);
          });
      })
    );
  } catch (err) {
    console.error(err);
  }
}

async function registerUserWithTopic(userUid, topic) {
  const user = await db.doc("users/" + userUid).get();
  const userData = user.data();
  const pushToken = userData.pushToken;

  const hash = Buffer.from(sha256(userUid + topic)).toString("hex");
  await db.collection("pushTopics").doc(hash).set({
    topic,
    userUid,
    pushToken,
  });
}

async function unregisterUserWithTopic(userUid, topic) {
  const hash = Buffer.from(sha256(userUid + topic)).toString("hex");
  await db.collection("pushTopics").doc(hash).delete();
}

async function removeToken(token) {
  await db
    .collection("pushTopics")
    .where("pushToken", "==", token)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        doc.ref.delete();
      });
    });
}

module.exports = {
  sendNotification,
  registerUserWithTopic,
  unregisterUserWithTopic,
  removeToken,
};
