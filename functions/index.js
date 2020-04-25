const functions = require('firebase-functions');
const app=require('express')();
const cors=require('cors');
app.use(cors());
const {db}=require('./util/admin');
const {
    getAllScreams,postOnScream,
    likeScream,unlikeScream,
    deleteScream,getUserScreams,
    getScream,commentOnScream}=require('./handlers/screams');
const {
    signUp,login,
    uploadImage,
    addUserDetails,
    getUserDetails,
    markeNotificationRead,
    getAuthenticatedUser}=require('./handlers/users');
const FBAuth=require('./util/FBAuth')

/*screams routes************************/

//get all screams
 app.get('/screams',getAllScreams);
 //get user screams
 app.get('/user/screams',FBAuth,getUserScreams);
 //get scream by id
 app.get('/scream/:screamId',getScream)
 //add new scream
 app.post('/scream',FBAuth,postOnScream);
 //  delete scream
 app.delete('/scream/:screamId',FBAuth,deleteScream);
 //like on scream
 app.get('/scream/:screamId/unlike',FBAuth,unlikeScream)
 //unlike on scream
 app.get('/scream/:screamId/like',FBAuth,likeScream)
 //comment on scream
 app.post('/scream/:screamId/comment',FBAuth,commentOnScream)
 

 /*users routes*************************************/
 app.post('/signup',signUp)
 app.post('/login',login)


 /*profile routes************************************/

 //upload user image
 app.post('/user/image',FBAuth,uploadImage)
 //add user details
 app.post('/user',FBAuth,addUserDetails)
 //get usre data
 app.get('/user',FBAuth,getAuthenticatedUser)
 app.get('/user/:handle',getUserDetails)
 app.post('/notifications',FBAuth,markeNotificationRead)

 exports.api=functions.region('europe-west1').https.onRequest(app);

 exports.createNotificationsOnLike=functions.region('europe-west1')
 .firestore.document('likes/{id}').onCreate(likeSnapshot=>{
    return db.doc(`/screams/${likeSnapshot.data().screamId}`).get()
    .then(screamDoc=>{
        if(screamDoc.exists && screamDoc.data().userHandle!==likeSnapshot.data().userHandle){
           return db.doc(`/notifications/${likeSnapshot.id}`).set({
                createdAt:new Date().toISOString(),
                recipient:screamDoc.data().userHandle,
                sender:likeSnapshot.data().userHandle,
                read:false,
                screamId:screamDoc.id,
                type:"like",
            });           
        }
    })
    .catch(()=>null)
 })

 exports.deleteNotificationsOnUnLike=functions.region('europe-west1')
 .firestore.document('likes/{id}').onDelete((likeSnapshot)=>{
   return  db.doc(`/notifications/${likeSnapshot.id}`).delete()
    .catch(err=>null)
 })
 
 exports.createNotificationsOnComment=functions.region('europe-west1')
 .firestore.document('comments/{id}').onCreate((commentSnapshot)=>{
    return db.doc(`/screams/${commentSnapshot.data().screamId}`).get().then(screamDoc=>{
        if(screamDoc.exists){
            db.doc(`/notifications/${commentSnapshot.id}`).set({
                createdAt:new Date().toISOString(),
                recipient:screamDoc.data().userHandle,
                sender:commentSnapshot.data().userHandle,
                read:false,
                screamId:screamDoc.id,
                type:"comment",
            });            
        }
    })
    .catch(()=>null)
 })

 exports.onUserImageChanges=functions.region('europe-west1')
 .firestore.document('users/{userId}').onUpdate(change=>{
 if(change.before.data().imgUrl===change.after.data().imgUrl)return null;
 const batch=db.batch();
 return db.collection("screams").where("userHandle","==",change.before.data().handle).get()
 .then(screamsDocs=>{
    screamsDocs.forEach(screamDoc=>{
          batch.update(screamDoc.ref,{userImage:change.after.data().imgUrl})
    });
    batch.commit();
 })
 .catch(err=>null)
 })

 exports.onScreamDelete=functions.region('europe-west1')
 .firestore.document('screams/{screamId}').onDelete((scream,context)=>{
     const screamId=context.params.screamId;
     const batch=db.batch();
     return db.collection('comments').where("screamId","==",screamId).get()
     .then(commentsDocs=>{
         commentsDocs.forEach(commentDoc=>{
             batch.delete(commentDoc.ref);
         });
         return db.collection('likes').where('screamId','==',screamId).get();
     })
     .then(likesDocs=>{
         likesDocs.forEach(likeDoc=>{
             batch.delete(likeDoc.ref);
         })
         return db.collection('notifications').where('screamId','==',screamId).get();
     })
     .then(notificationsDocs=>{
        notificationsDocs.forEach(notfDoc=>{
            batch.delete(notfDoc.ref);
        })
        return batch.commit();
    })
    .catch(err=>null)
 })
