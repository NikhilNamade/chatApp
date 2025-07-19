const mongoose = require("mongoose");
const { Schema } = mongoose;

const MessageSchema = new Schema({

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "USER",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel', // tells Mongoose to look at `receiverModel` to know what model to use
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['USER', 'ROOM'], // only allow these two
    },
    text: {
        type: String,
    },
    media: {
        type: String,
    },
    mediaName: {
        type: String,
    },
    mediaType: {
        type: String,
    },
    seen: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("MESSAGE", MessageSchema);