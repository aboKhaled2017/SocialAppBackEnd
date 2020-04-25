const validator=require('./validator');
module.exports={
    signupValidator:({email,password,confirmPassword,handle})=>{
    let errors={},hasError=false;
    let emailValidator=validator.validateEmail(email);
    let passValidator=validator.validatePassword(password);
    let handleValidator=validator.validateHandle(handle);
    if(!emailValidator.ok){
        hasError=true;
        errors.email=emailValidator.error;
    }
    if(!passValidator.ok){
        hasError=true;
        errors.password=passValidator.error;
    }
    if(!handleValidator.ok){
        hasError=true;
        errors.handle=handleValidator.error;
    }
    if(password!==confirmPassword)
    {
        hasError=true;
        errors.confirmPassword='Two passwords must be identical';
    }
    return{
    hasError,
    errors
    }
    },
    loginValidator:({email,password})=>{
        let errors={},hasError=false;
        let emailValidator=validator.validateEmail(email);
        let passValidator=validator.validatePassword(password);
        if(!emailValidator.ok){
            hasError=true;
            errors.email=emailValidator.error;
        }
        if(!passValidator.ok){
            hasError=true;
            errors.password=passValidator.error;
        }
        return{
        hasError,
        errors
        }
    },
    reduceUserDetails:data=>{
        let userDetails={};
        if(data.bio && !validator.IsEmpty(data.bio.trim()))userDetails.bio=data.bio;
        if(data.website && !validator.IsEmpty(data.website.trim())){
           if(data.website.trim().substring(0,4)!=="http"){
               userDetails.website=`http://${data.website.trim()}`
           }
           else{
               userDetails.website=data.website;
           }
        }
        if(data.location && !validator.IsEmpty(data.location.trim()))userDetails.location=data.location;
        return userDetails;
    },
    validateComment:comment=>{
        let isValid=!validator.IsEmpty(comment);
        return {
            ok:isValid,
            error:!isValid?"must not be empty":null
        }
    }
}