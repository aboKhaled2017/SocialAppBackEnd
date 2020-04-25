let db={
    users:[
        {
            userId:"itwZRLcOgXV1h4pUYFVLmkprkWu1",
            email:"ali@gmail.com",
            handle:"user",
            createdAt:"2019-205",
            imgUrl:"",
            bio:"hello my name is ahemd",
            website:"https/user/",
            location:"egypt sohage"
        }
    ],
    screams:[
        {
            userHandle:'user handle 1',
            body:'user body 1',
            createdAt:"2020-04-17T22:42:29.661Z",
            likeCount:5,
            commentCount:2
        }
    ],
    comments:[
        {
            userHandle:'user',
            screamId:"",
            createdAt:"",
            body:""
        }
    ],
    likes:[{
        userHandle:"",
        screamId:""
    }],
    notifications:[{
        recipient:"user",
        sender:"mohamed",
        read:'true | false',
        screamId:"",
        type:"like | comment",
        createdAt:""
    }]
}
const userDetails={
    //Redux data
    credentials:{
        userId:"itwZRLcOgXV1h4pUYFVLmkprkWu1",
        email:"ali@gmail.com",
        handle:"user",
        createdAt:"2019-205",
        imgUrl:"",
        bio:"hello my name is ahemd",
        website:"https/user/",
        location:"egypt sohage"
    },
    likes:[
        {
            userHandle:"user",
            screamId:"7jpA2u2u53HZ9Y1CErv1"
        },
        {
            userHandle:"new",
            screamId:"epk4F5wagpv4Orzqa410"
        }
    ]
}