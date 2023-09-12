const { sha256 } = require("@cosmjs/crypto");
const { db } = require("./firebase");
const { Web3Storage, File } = require("web3.storage");

const web3Uplodad = async (content) => {
  const hash = Buffer.from(sha256(content)).toString("hex");
  const existingUpload = await db.doc("contentHash/" + hash).get();
  if (existingUpload.exists) {
    return existingUpload.data().cid;
  }

  const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });

  // uploads the file to web3.storage
  const file = new File([content], "section.txt", { type: "text/plain" });
  const cid = await client.put([file]);

  return cid;
};

module.exports = {
  web3Uplodad,
};
