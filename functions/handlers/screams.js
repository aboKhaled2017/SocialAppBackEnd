const {db}=require('../util/admin');
const {validateComment}=require('../util/helperMethods')
exports.getAllScreams=(req,res)=>{
    db.collection('screams')
    .orderBy('createdAt','asc')
    .get()
    .then(data=>{
        let screams=[];
        data.forEach(doc => {
            screams.push({
                screamId:doc.id,
                body:doc.data().body,
                userHandle:doc.data().userHandle,
                createdAt:doc.data().createdAt,
                likeCount:doc.data().likeCount,
                commentCount:doc.data().commentCount,               
                userImage:doc.data().userImage
            });
        });
        return res.json(screams)
    })
    .catch(err=>{console.error(err)})
}
exports.getUserScreams=(req,res)=>{
    db.collection('screams')
    .orderBy('createdAt','asc')
    .where("userHandle","==",req.user.handle)
    .get()
    .then(data=>{
        let screams=[];
        data.forEach(doc => {
            screams.push({
                screamId:doc.id,
                body:doc.data().body,
                userHandle:doc.data().userHandle,
                createdAt:doc.data().createdAt
            });
        });
        return res.json(screams)
    })
    .catch(err=>{console.error(err)})
}
exports.postOnScream=(req,res)=>{
    let newScream={
        userHandle:req.user.handle,
        body:req.body.body,
        createdAt:new Date().toISOString(),
        userImage:req.user.imgUrl,
        likeCount:0,
        commentCount:0
    }
    if(req.body.body==""){
        return res.status(500).json({body:'scream cannot be empty'})
    }
    db.collection('screams')
    .add(newScream)
    .then(doc=>{
        newScream.screamId=doc.id;
        res.json(newScream);
    })
    .catch(err=>{
        res.status(501).json({error:'cannot create screame for some error'})
        console.error(err)
    })
}
exports.getScream=(req,res)=>{
    let screamData={};
    db.doc(`/screams/${req.params.screamId}`).get()
    .then(doc=>{
        if(!doc.exists)
        return res.status(404).json({error:"scream not found"});        
        screamData=doc.data();
        screamData.screamId=doc.id;       
        return db.collection("comments")
        .orderBy("createdAt","desc")
        .where("screamId","==",req.params.screamId).get();
    })
    .then(data=>{
        screamData.comments=[];
        data.forEach(doc=>{
            screamData.comments.push(doc.data())
        });
        return res.json(screamData);
    })
    .catch(err=>{
        return res.status(500).json({error:err.code})
    })
}
exports.commentOnScream=(req,res)=>{
    let newComment={
        createdAt:new Date().toISOString(),
        userHandle:req.user.handle,
        screamId:req.params.screamId,
        userImage:req.user.imgUrl,
        body:req.body.body,        
    }
    const {ok,error}=validateComment(newComment.body);
    if(!ok)
    return res.status(400).json({comment:error});
    
    db.doc(`/screams/${req.params.screamId}`).get()
    .then(doc=>{
        if(!doc.exists)
        return res.status(404).json({error:"scream not found"});
        return doc.ref.update({commentCount:doc.data().commentCount+1});
    })
    .then(()=>{
        return db.collection("comments").add(newComment);
    })
    .then(()=>{
       res.json(newComment);
    })
    .catch(err=>{
        return res.status(500).json({error:"something went wronge"})
    }) 
}
exports.likeScream=(req,res)=>{
    const likeDocument=db.collection("likes")
    .where("userHandle","==",req.user.handle)
    .where("screamId","==",req.params.screamId)
    .limit(1);
    
    const screamDocument=db.doc(`/screams/${req.params.screamId}`);
    let screamData;
    screamDocument.get().then(doc=>{
        console.log(JSON.stringify(doc.data()))
        if(!doc.exists)
        return res.status(400).json({error:"scream is not found"});
        screamData=doc.data();
        screamData.screamId=doc.id;
        return likeDocument.get();
    })
    .then(docData=>{
        if(docData.empty){
                return db.collection("likes").add({
                    userHandle:req.user.handle,
                    screamId:req.params.screamId
                })
                .then(()=>{
                    screamData.likeCount++;
                    return screamDocument.update({likeCount:screamData.likeCount})
                })
                .then(()=>{
                     res.json(screamData);
                })
        }
        else{
                return res.status(400).json({error:"stream already liked"})
        }
    })
    .catch(err=>{
        return res.status(500).json({error:err.code})
    }) 
}
exports.unlikeScream=(req,res)=>{
    const likeDocument=db.collection("likes")
    .where("userHandle","==",req.user.handle)
    .where("screamId","==",req.params.screamId)
    .limit(1);
    const screamDocument=db.doc(`/screams/${req.params.screamId}`);
    let screamData;
    screamDocument.get().then(doc=>{
        if(!doc.exists)
        return res.status(400).json({error:"scream is not found"});
        screamData=doc.data();
        screamData.screamId=doc.id;
        return likeDocument.get();
    })
    .then(data=>{
        if(!data.empty){
               return db.doc(`/likes/${data.docs[0].id}`).delete()
               .then(()=>{
                   screamData.likeCount--;
                   return screamDocument.update({likeCount:screamData.likeCount})
               })
               .then(()=>{
                    res.json(screamData)
               })
        }
        else{
                return res.status(400).json({error:"stream is not liked"})
        }
    })
    .catch(err=>{
        return res.status(500).json({error:err.code})
    }) 
}
exports.deleteScream=(req,res)=>{
    const screamDoc=db.doc(`/screams/${req.params.screamId}`);
    screamDoc.get()
    .then(doc=>{
        if(!doc.exists)
        return res.status(404).json({error:`scream with id ${req.params.screamId} not found`});
        if(req.user.handle!==doc.data().userHandle)
        return res.status(403).json({error:"UnAuthorized"})
        screamDoc.delete().then(()=>{
            res.json({message:'scream deleted successfully'})
        })
    })
    .catch(err=>{
        return res.status(500).json({error:err.code})
    }) 
}