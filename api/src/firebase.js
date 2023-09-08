const admin = require("firebase-admin");

var serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
var db = admin.firestore();
var auth = admin.auth();

function getToken(request) {
  if (!request.headers.authorization) {
    return undefined;
  }

  const token = request.headers.authorization.replace(/^Bearer\s/, "");

  return token;
}
const getUser = async (req) => {
  const idToken = await getToken(req);
  const user = await admin.auth().verifyIdToken(idToken);
  return user;
};

module.exports = {
  db,
  auth,
  admin,
  getUser,
};
