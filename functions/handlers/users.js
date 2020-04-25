const {db,admin}=require('../util/admin');
const {loginValidator,signupValidator,reduceUserDetails}=require('../util/helperMethods')
const firebaseConfig=require('../util/config');
const firebase=require('firebase')
const serviceAccount = require('../serviceKey.json');
firebase.initializeApp({...firebaseConfig,credential: admin.credential.cert(serviceAccount)});
const defaultImg='no-img.png',serverError='Something went wrong ,please try again';
//signUp user
exports.signUp=(req,res)=>{
    let token,userId;
    const newUser={
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword,
        handle:req.body.handle,
    }
    const {hasError,errors}=signupValidator(newUser);
    if(hasError){
        return res.status(400).json(errors)
    }
    //validate
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc=>{
        if(doc.exists){
            return res.status(500).json({handle:'this handle is already token'})
        }
        else{
            return firebase.auth().createUserWithEmailAndPassword(newUser.email,newUser.password);
        }
    })   
    .then(data=>{
        userId=data.user.uid;
        return data.user.getIdToken()
    })
    .then((idToken)=>{
        token=idToken;
        const userCredentials={
            email:newUser.email,
            handle:newUser.handle,
            createdAt:new Date().toISOString(),
            userId,
            imgUrl:`https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${defaultImg}?alt=media`
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);       
    })
    .then(()=>{
       return res.status(201).json({token})
    })
    .catch((err)=>{
        if(err.code===`auth/email-already-in-use`){
            return res.status(400).json({email:"email is already in use"})
        }
       return res.status(500).json({general:serverError})
    })
}
//login user
exports.login=(req,res)=>{
    const user={
        email:req.body.email,
        password:req.body.password,
    }
    const {hasError,errors}=loginValidator(user);
    if(hasError){
        return res.status(400).json(errors)
    }
    firebase.auth().signInWithEmailAndPassword(user.email,user.password)
    .then(data=>{
     return data.user.getIdToken()
    })
    .then(token=>{
        return res.json({token})
    })
    .catch(err=>{
        if(err.code==="auth/user-not-found"||err.code==="auth/wrong-password")
        return res.status(403).json({general:"Wronge credentials, try again"})
        return res.status(500).json({general:serverError})
    })
}
//upload image
exports.uploadImage=(req,res)=>{
    const BusBoy=require('busboy');
    const path=require('path');
    const os=require('os');
    const fs=require('fs');

    let imgFileName,imgToBeUploaded={};
    const busboy=new BusBoy({headers:req.headers});
    busboy.on('file',(feildname,file,filename,encoding,mimetype)=>{
        if(mimetype!=="image/jpeg" && mimetype!=="image/png"){
          return res.status(400).json({error:"Wrong file type submitted"})
        }
       const imgExtension=filename.split('.')[filename.split('.').length-1];
       imgFileName=`${Math.round(Math.random()*100000000000)}.${imgExtension}`;
       const filePath=path.join(os.tmpdir(),imgFileName)
       imgToBeUploaded={filePath,mimetype};
       file.pipe(fs.createWriteStream(filePath))
    })
    busboy.on('finish',()=>{
       admin.storage().bucket("socialapp-a7454.appspot.com").upload(imgToBeUploaded.filePath,{
           resumable:false,
           metadata:{
               metadata:{
                   contentType:imgToBeUploaded.mimetype
               }
           }
       })
       .then(()=>{
           const imgUrl=`https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imgFileName}?alt=media`;
           return db.doc(`users/${req.user.handle}`).update({imgUrl});
       })
       .then(()=>{
          return res.json({message:"image uploaded successfully"})
       })
       .catch(err=>{
           return res.status(500).json({error:err.code})
       })
    })
    busboy.end(req.rawBody);
}
//add user details
exports.addUserDetails=(req,res)=>{
    let userDetails=reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(()=>{
        return res.json({message:'Details added successfully'})
    })
    .catch(err=>{
        return res.status(500).json({error:err.code});
    })
}

//get own user details
exports.getAuthenticatedUser=(req,res)=>{
let userData={};
db.doc(`/users/${req.user.handle}`).get()
.then(doc=>{
  if(doc.exists){
      userData.credentials=doc.data();
      return db.collection("likes").where("userHandle","==",req.user.handle).get()
  }
 })
 .then(likesDocs=>{
    userData.likes=[];//likes that user made
    likesDocs.forEach(doc=>{
        userData.likes.push(doc.data());
    });
    return db.collection('notifications')
    .where('recipient',"==",req.user.handle)
    .orderBy('createdAt',"desc").limit(10).get()
  })
  .then(notificationsDocs=>{
    userData.notifications=[];//likes that user made
    notificationsDocs.forEach(doc=>{
        userData.notifications.push({...doc.data(),notificationId:doc.id});
    });
  })
  .then(()=>{
       res.json(userData)
  })
 .catch(err=>{
     return res.status(500).json({error:err.code});
 })
}
//get general user details
exports.getUserDetails=(req,res)=>{
    let userData={};
    db.doc(`/users/${req.params.handle}`).get()
    .then(doc=>{
      if(doc.exists){
          userData.user=doc.data();
          return db.collection("screams").where("userHandle","==",req.params.handle)
          .orderBy('createdAt','desc').get()
      }
      return res.status(404).json({error:"user not found"});
     }) 
     .then(screamsDocs=>{
         userData.screams=[];
         screamsDocs.forEach(doc=>{
             userData.screams.push({
                 screamId:doc.id,
                 userHandle:doc.data().userHandle,
                 userImage:doc.data().userImage,
                 body:doc.data().body,
                 createdAt:doc.data().createdAt,
                 likeCount:doc.data().likeCount,
                 commentCount:doc.data().commentCount
             })
         })
         return res.json(userData)
     })     
     .catch(err=>{
         return res.status(500).json({error:err.code});
     })
}
//marke read notification when seen
exports.markeNotificationRead=(req,res)=>{
    let batch=db.batch();
    req.body.forEach(notificationId=>{
        const notification=db.doc(`/notifications/${notificationId}`);
        batch.update(notification,{read:true});
    });
     batch.commit().then(()=>{
       res.json({message:"Notification marked read"})
     })
     .catch(err=>{
        return res.status(500).json({error:err.code});
    })
}