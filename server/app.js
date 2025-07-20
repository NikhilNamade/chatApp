const express = require("express");
const cors = require("cors");
const connectTomongoose = require("./db");
connectTomongoose();
const port = 5000;
const app = express();
const USER = require("./model/USER");
const ROOM = require("./model/ROOM");

//scoketio
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const userSocketMap = new Map();
const io = new Server(server, {
    cors: {
        origin: "https://chat-app-beta-one-91.vercel.app",
        method: ["GET", "POST", "PUT", "DELETE"],
        credential: true,
    }
})


// store online users
const userScoketmap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected: " + userId);

    if (userId && userId !== 'undefined') {
        // Store user in both maps for consistency
        userSocketMap.set(userId, socket.id);
        userScoketmap[userId] = socket.id;

        // Emit updated online users list
        io.emit("getOnlineUser", Object.keys(userScoketmap));
        console.log("Online users:", Object.keys(userScoketmap));
    } else {
        console.warn("Socket connected without a valid userId!");
        return;
    }
    socket.on("roomjoin", (roomIds) => {
        if (Array.isArray(roomIds)) {
            roomIds.forEach(id => {
                socket.join(id);
                console.log(`User ${userId} joined room ${id}`);
            });
        }
    });

    socket.on("createRoom", async ({ roomName, users, creator }, callback) => {
        const roomId = `room_${Date.now()}`;
        users.forEach((userid) => {
            const sid = userSocketMap.get(userid);
            if (sid) {
                io.to(sid).socketsJoin(roomId);
            }
        });

        const room = await ROOM.create({
            roomId,
            roomName,
            members: users,
            createdBy: creator,
        });
        callback({ success: true, room });
    });

    socket.on("addUsersToRoom", async ({ roomId, userIds }) => {
        try {
            // Add new users to the socket room
            userIds.forEach((userId) => {
                const socketId = userSocketMap.get(userId);
                if (socketId) {
                    io.to(socketId).socketsJoin(roomId);
                    console.log(`User ${userId} added to room ${roomId}`);
                }
            });

            // Emit to all room members about the new users
            io.to(roomId).emit("usersAddedToRoom", {
                roomId,
                addedUserIds: userIds
            });
        } catch (error) {
            console.error("Error adding users to room:", error);
        }
    });

    // socket.on("joinroom",(r))

    io.emit("getOnlineUser", Object.keys(userScoketmap));

    // Handle real-time message sending
    socket.on("sendMessage", async (messageData) => {
        try {
            const { receiverId, receiverModel, text, media } = messageData;
            const isRoomMessage = receiverModel === 'ROOM';

            if (isRoomMessage) {
                // Send to all users in the room
                io.to(receiverId).emit("newMsg", messageData);
                console.log(`Message sent to room ${receiverId}`);
            } else {
                // Send to specific user
                const receiverSocketId = userScoketmap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMsg", messageData);
                    console.log(`Message sent to user ${receiverId}`);
                } else {
                    console.log(`User ${receiverId} is offline`);
                }
            }
        } catch (error) {
            console.error("Error handling sendMessage:", error);
        }
    });

    socket.on("disconnect", async () => {
        const lastSeen = new Date();
        console.log("User Disconnected: " + userId);

        // Clean up both maps
        if (userId && userId !== 'undefined') {
            delete userScoketmap[userId];
            userSocketMap.delete(userId);

            // Emit updated online users list
            io.emit("getOnlineUser", Object.keys(userScoketmap));
            console.log("Updated online users after disconnect:", Object.keys(userScoketmap));
        }

        try {
            await USER.findByIdAndUpdate(userId, { lastSeen });
        } catch (err) {
            console.error("Error updating lastSeen:", err.message);
        }
    })
})

module.exports = { io, userScoketmap, userSocketMap };
// middelware
app.use(cors({
    origin: "https://chat-app-beta-one-91.vercel.app",
    method: ["GET", "POST"],
    credential: true,
}))
app.use(express.json());
app.use("/api/auth", require("./route/auth"));
app.use("/api/msg", require("./route/message"));
app.use("/api/room", require("./route/room"))

server.listen(port, () => {
    console.log(`server is running on port ${port}`);
})