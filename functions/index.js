const functions = require("firebase-functions");
const { SigningCosmWasmClient, Secp256k1HdWallet, CosmWasmClient } = require("cosmwasm");
const { GasPrice } = require('@cosmjs/stargate');
const { stringToPath } = require('@cosmjs/crypto');
const sendTweet = require('./twitter')
const {loadNft} = require('./stargaze')

global.fetch = require("node-fetch") // needed by stargaze

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const cycle = async () => {
    const rpc = "https://rpc.elgafar-1.stargaze-apis.com";
    const signer = await Secp256k1HdWallet.fromMnemonic(process.env.MNEMONIC, { 
        hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
        prefix: 'stars' 
    });

    const defaultGasPrice = GasPrice.fromString('0.5ustars')

    const signingClient = await SigningCosmWasmClient.connectWithSigner(
        rpc,
        signer,
        {
            broadcastPollIntervalMs: 300,
            broadcastTimeoutMs: 8_000,
            gasPrice: defaultGasPrice,
        }
    )
    const res = await signingClient.execute(process.env.ADDRESS, process.env.CONTRACT, { cycle: {}}, "auto");
    console.log(res)
    return res
}
exports.scheduledCycle = functions
    .runWith({
        timeoutSeconds: 300
    })
    .pubsub
    .schedule('every day 00:00')
    .onRun(async (context) => {
    cycle()
});
exports.cycle = functions.runWith({
    timeoutSeconds: 300,
}).https.onRequest(async (req, res) => {
    const response = await cycle()
    res.status(200).send(response)
});

exports.scheduleCheckNewSections = functions.runWith({
    timeoutSeconds: 300,
    memory: '1GB'
})
.pubsub
.schedule('every hour')
.onRun(async (context) => {
    await checkNewSections()
})

exports.checkNewSectionsTrigger = functions.runWith({
    timeoutSeconds: 300,
    memory: '1GB'
}).https.onRequest(async (req, res) => {
    const response = await checkNewSections()
    res.status(200).send(response)
});

async function tweet(text, image) {
    const docSnap = await db.doc('functions/tweeter').get();
    const cookies = docSnap.data()?.cookies;
    const new_cookies = await sendTweet(text, image, cookies ? JSON.parse(cookies) : null);
    await db.doc('functions/tweeter').set({
        cookies: new_cookies
    }, {
        merge: true
    })
}

async function checkNewSections() {
    const rpc = "https://rpc.elgafar-1.stargaze-apis.com";

    const client = await CosmWasmClient.connect(
        rpc,
    )

    const docSnap = await db.doc('functions/sections_last_check').get();
    const lastCheck = docSnap.data()?.block || 0;
    const block = await client.getBlock()
    const sections = await client.queryContractSmart(process.env.CONTRACT, { get_new_sections: {
        after: lastCheck
    }}, "auto");

    console.log(lastCheck, sections)

    await Promise.all(sections.map(async (section ) => {
        const header = `New chapter!\n\n`
        const link = `https://onceupon.community/story/${section.story_id}/read`;
        const footer = `\n\nRead more at ${link}`
        const text = header + section.content.substr(0,280-94) + '...' + footer

        const token = section.nft ? await loadNft(section.nft) : null
        const imageUrl = token ? token.media.image.jpgLink : null;
        await tweet(text, imageUrl)
    }));

    await db.doc('functions/sections_last_check').set({
        block: block.header.height
    });
}