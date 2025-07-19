const express = require("express");
const route = express.Router();
const USER = require("../model/USER");
const MESSAGE = require("../model/MESSAGE");
const jwt = require("jsonwebtoken");
const JWT_TOKEN = "thisischatapp";
const fecthuser = require("../middelware/fecthuser");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
require('dotenv').config();



route.post("/login",
    [
        body("phNo").isLength({ max: 10 }),
        body("password").isLength({ min: 5 }),
    ],
    async (req, res) => {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({ error: error.array() });
        }
        try {
            const { phNo, password } = req.body;
            let user = await USER.findOne({ phNo: phNo });
            if (!user) {
                return res.json({ success: false });
            }
            let validPass = await bcrypt.compare(password, user.password);
            if (!validPass) {
                return res.json({ success: false });
            }
            const data = {
                user: {
                    id: user.id,
                },
            };
            const jwtToken = await jwt.sign(data, JWT_TOKEN);
            return res.json({ success: true, jwtToken, user });
        } catch (error) {
            res.send(error);
        }
    })


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






route.post("/register",
upload.single("profilePic"),
    [
        body("phNo").isLength({ max: 10 }),
        body("password").isLength({ min: 5 }),
    ],
    async (req, res) => {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({ success: false, error: error.array() });
        }
        try {
            const { name, phNo, password } = req.body;
            const profilePic = req.file;
            let user = await USER.findOne({ phNo: req.body.phNo });
            if (user) {
                return res.json({ success: false });
            }
            const salt = await bcrypt.genSaltSync(10);
            const hash = await bcrypt.hash(password, salt);

            if (profilePic) {
                const uploadResult = await uploadToS3(profilePic.buffer, profilePic.originalname, profilePic.mimetype);
                user = await USER.create({
                    name,
                    phNo,
                    password: hash,
                    profilePic: uploadResult.secure_url,
                });
            } else {
                user = await USER.create({
                    name,
                    phNo,
                    password: hash,
                });
            }
            const data = {
                user: {
                    id: user.id,
                },
            };
            const jwtToken = await jwt.sign(data, JWT_TOKEN);
            return res.json({ success: true, jwtToken, user });
        } catch (error) {
            res.send(error);
        }
    })

route.get("/fecthalluser", fecthuser, async (req, res) => {
    try {
        const id = req.user.id;
        let users = await USER.find({ _id: { $ne: id } }).select("-password");
        if (!users) {
            return res.json({ success: false });
        }

        //count unseen msg
        const unseenmsg = {};

        const promise = users.map(async (user) => {
            const message = await MESSAGE.find({ senderId: user._id, receiverId: id, seen: false });
            if (message.length > 0) {
                unseenmsg[user._id] = message.length;
            }
        });

        await Promise.all(promise);
        res.json({ success: true, users, unseenmsg });
    } catch (error) {
        res.send(error);
    }
})

route.get("/fetchcurrentuser", fecthuser, async (req, res) => {
    try {
        const id = req.user.id;
        let user = await USER.findById(id).select("-password");
        if (!user) {
            return res.send("User not found");
        }
        res.json({ user });
    } catch (error) {
        res.send(error);
    }
})
route.get("/fetchbyid/:id", fecthuser, async (req, res) => {
    try {
        let id = req.user.id;
        let user = await USER.findById(req.params.id).select("-password");
        if (!user) {
            return res.send("User not found");
        }

        const message = await MESSAGE.find({
            $or: [
                { senderId: req.params.id, receiverId: id },
                { senderId: id, receiverId: req.params.id },
            ]
        });
        await MESSAGE.updateMany({ senderId: req.params.id, receiverId: id }, { seen: true });
        res.json({ success: true, user, message });
    } catch (error) {
        res.send(error);
    }
})
module.exports = route;