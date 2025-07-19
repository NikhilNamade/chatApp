const mongoose = require("mongoose");
const {Schema} = mongoose;

const roomSchema =   new Schema({
    roomId:{
        type:String,
        required:true,
    },
    roomName:{
        type:String,
        required:true,
    },
    members:[{ type: mongoose.Schema.Types.ObjectId, ref: 'USER' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "USER", required: true },
},{timestamps:true});

module.exports = mongoose.model("ROOM",roomSchema);