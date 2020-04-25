module.exports={
        IsEmpty(email){return email.trim()==""},
        isValidEmail(email){   
            let emailRegex=/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            return email.match(emailRegex)!=null
        },
        validateEmail(email){
            let isEmpty=this.IsEmpty(email);
            let isValidEmail=this.isValidEmail(email);  
        return{
            ok:!isEmpty&&isValidEmail,
            error:isEmpty?'Email must not be empty'
            :!isValidEmail?'Email is not valid'
            :null
        }
        },
        validatePassword(pass){
            let isEmpty=this.IsEmpty(pass);
            let isValidPass=pass.length>=6;
        return{
            ok:!isEmpty&&isValidPass,
            error:isEmpty?'Password must not be empty'
            :!isValidPass?'Password is not valid'
            :null
        }
        },
        validateHandle(handle){
            let isEmpty=this.IsEmpty(handle);
        return{
            ok:!isEmpty,
            error:isEmpty?'userHandle must not be empty'
            :null
        }
        }
}