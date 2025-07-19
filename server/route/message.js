const express = require("express");
const route = express.Router();
const fetchuser = require("../middelware/fecthuser");
const MESSAGE = require("../model/MESSAGE");
const { io, userScoketmap } = require("../app");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
require('dotenv').config();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept all file types
        cb(null, true);
    }
});

// Configure AWS S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Helper function to upload to S3
const uploadToS3 = async (buffer, originalName, mimetype) => {
    try {
        // Generate unique filename
        const fileExtension = path.extname(originalName);
        const uniqueFileName = `chat-app-media/${crypto.randomUUID()}${fileExtension}`;
        
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: uniqueFileName,
            Body: buffer,
            ContentType: mimetype,
            // ACL: 'public-read' // Make file publicly accessible
        };

        const command = new PutObjectCommand(uploadParams);
        const result = await s3Client.send(command);
        
        // Construct the public URL
        const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;
        
        return {
            secure_url: publicUrl,
            public_id: uniqueFileName
        };
    } catch (error) {
        throw error;
    }
};


//send msg
route.post("/sendmsg", fetchuser, upload.single("media"), async (req, res) => {
    try {
        console.log("req.user:", req.user);
        const senderId = req.user.id;
        console.log("senderId:", senderId);
        const { receiverId, receiverModel } = req.body;
        console.log("Request body:", req.body.receiverId, req.body.receiverModel);
        const media = req.file;
        if (!receiverId || !senderId) {
            console.log("Validation failed:", { receiverId, text, senderId });
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // Determine if it's a room or user message
        const isRoomMessage = receiverModel === 'ROOM';
        const targetModel = isRoomMessage ? 'ROOM' : 'USER';

        let message;

        if (!media && req.body.text) {
            message = await MESSAGE.create({
                senderId,
                receiverId,
                receiverModel: targetModel,
                text : req.body.text,
            });
        } else if (media && !req.body.text) {
            const uploadResult = await uploadToS3(media.buffer, media.originalname, media.mimetype);
            message = await MESSAGE.create({
                senderId,
                receiverId,
                receiverModel: targetModel,
                media: uploadResult.secure_url,
                mediaName: media.originalname,
                mediaType: media.mimetype,
            });
        } else if (media && req.body.text) {

            const uploadResult = await uploadToS3(media.buffer, media.originalname, media.mimetype);
            message = await MESSAGE.create({
                senderId,
                receiverId,
                receiverModel: targetModel,
                text : req.body.text,
                media: uploadResult.secure_url,
                mediaName: media.originalname,
                mediaType: media.mimetype,
            });
        } else {
            return res.status(400).json({ success: false, error: "Missing required fields msg" });
        }

        // Populate the message with sender info
        await message.populate('senderId', 'name profilePic');

        if (isRoomMessage) {
            // For room messages, emit to all room members
            io.to(receiverId).emit("newMsg", message);
        } else {
            // For user messages, emit to specific user
            const reciverSocketId = userScoketmap[receiverId];
            if (reciverSocketId) {
                io.to(reciverSocketId).emit("newMsg", message);
            }
        }

        res.json({ success: true, message });
    } catch (error) {
        console.error("Error in /sendmsg:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


//marksseen

route.put("/mark/:id", async (req, res) => {
    try {
        const senderId = req.params.id;

        await MESSAGE.updateMany({ senderId: senderId }, { seen: true });
        res.json({ success: true });

    } catch (error) {
        console.error("Error in /sendmsg:", error);
        res.status(500).json({ success: false, error: error.message });
    }
})

module.exports = route;