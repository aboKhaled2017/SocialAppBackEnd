const admin=require('firebase-admin');
//admin.initializeApp();
var serviceAccount = require('../serviceKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialapp-a7454.firebaseio.com"
  });
const db=admin.firestore();
module.exports={
    admin,db
}