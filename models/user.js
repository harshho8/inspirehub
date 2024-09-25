const mongoose = require('mongoose');
const {createHmac,randomBytes}=require('crypto');
const{ createTokenForUser, validateToken}=require('../services/authentication')

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  salt:{
    type:String,
},
password:{
    type:String,
    required:true,
    unique:true,
},
  messages: [
    {
      type: String
    }
  ]
}, {
  timestamps: true
});

userSchema.pre('save',function(next){
  const user=this;

  if(!user.isModified("password"))return;

  const salt=randomBytes(16).toString();
  const hashedpassword=createHmac("sha256",salt)
  .update(user.password)
  .digest("hex");

  this.salt=salt;
  this.password=hashedpassword;
  next();
});



userSchema.static("matchPassword",async function(email,password){
  const user= await this.findOne({email});

  if(!user) throw new Error("user not found");

  const salt=user.salt;

  const hashedpassword=user.password;

  const userprovidedhash=createHmac("sha256",salt)
  .update(password)
  .digest("hex");

  if(hashedpassword!==userprovidedhash) {
      throw new Error("incorrect password");
  }

  const token=createTokenForUser(user);
  return token;
})























const User = mongoose.model('User', userSchema);

module.exports = User;
