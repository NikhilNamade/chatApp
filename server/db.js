const mongoose = require("mongoose");
require('dotenv').config();

const mongodbURI = process.env.MONGO_URI;

const connectTomongoose = () => {
    mongoose.connect(mongodbURI, {
        useUnifiedTopology: true,
    })
    console.log("connect to mongoDB");
}

module.exports = connectTomongoose