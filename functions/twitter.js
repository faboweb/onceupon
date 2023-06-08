const fs = require("fs");
const axios = require("axios");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const { sha256 } = require("@cosmjs/crypto");
const { createWriteStream } = require("fs");

async function downloadFile(fileUrl, outputLocationPath) {
  const writer = createWriteStream(outputLocationPath);

  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then((response) => {
    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}

const oauth = OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY,
    secret: process.env.TWITTER_CONSUMER_SECRET,
  },
  signature_method: "HMAC-SHA1",
  hash_function: (baseString, key) =>
    crypto.createHmac("sha1", key).update(baseString).digest("base64"),
});

async function tweet(text, imageUrl, db) {
  try {
    const token = {
      key: process.env.TWITTER_OAUTH_KEY,
      secret: process.env.TWITTER_OAUTH_SECRET,
    };

    let mediaId;
    if (imageUrl) {
      const hash = sha256(imageUrl);
      const storedImage = db.doc("media/" + hash).get();
      if (storedImage.exists) {
        mediaId = storedImage.data().mediaId;
      } else {
        await downloadFile(imageUrl, "/tmp/image.jpg"); // download image from url

        const authHeaderMedia = oauth.toHeader(
          oauth.authorize(
            {
              url: "https://upload.twitter.com/1.1/media/upload.json",
              method: "POST",
            },
            token
          )
        );

        const encodedImage = fs.readFileSync("/tmp/image.jpg", {
          encoding: "base64",
        });
        const form = new FormData();
        form.append("media_data", encodedImage);
        form.append("media-type", "image/jpeg");
        const {
          data: { media_id },
        } = await axios
          .post("https://upload.twitter.com/1.1/media/upload.json", form, {
            headers: {
              Authorization: authHeaderMedia["Authorization"],
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log(response.data);
          })
          .catch((err) => console.error(err.response.data));

        db.doc("media/" + hash).set({ mediaId, imageUrl });
        mediaId = media_id;
      }
    }

    const authHeaderTweet = oauth.toHeader(
      oauth.authorize(
        {
          url: `https://api.twitter.com/2/tweets`,
          method: "POST",
        },
        token
      )
    );
    const res = await axios.post(
      "https://api.twitter.com/2/tweets",
      {
        text,
        media_ids: mediaId ? [mediaId] : undefined,
      },
      {
        headers: {
          Authorization: authHeaderTweet["Authorization"],
          "user-agent": "v2CreateTweetJS",
          "content-type": "application/json",
          accept: "application/json",
        },
      }
    );
    return res.data.data.id; // tweet id
  } catch (err) {
    throw err;
  }
}

module.exports = tweet;
