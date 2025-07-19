const mongoose = require("mongoose");
const {Schema} = mongoose;
const userSchema = new Schema({
    name :{
        type:String,
        required : true,
    },
    phNo :{
        type:Number,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    profilePic : {
        type:String,
    },
    lastSeen:{
        type : Date,
    }
},{timestamps:true});

module.exports = mongoose.model("USER",userSchema);