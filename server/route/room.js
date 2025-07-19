const express = require("express");

const route = express.Router();
const ROOM = require("../model/ROOM");
const USER = require("../model/USER");
const MESSAGE = require("../model/MESSAGE");
const fetchuser = require("../middelware/fecthuser");
const {userSocketMap} = require("../app");

route.get("/fetchroom", fetchuser, async (req, res) => {
    try {

        const userid = req.user.id;
        let rooms = await ROOM.find({ members: userid });
        res.json({ success: true, rooms });
    } catch (error) {
        res.json({ success: false, error: error });
    }
});

route.get("/fetchbyid/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const room = await ROOM.findById(id).populate('members', ' _id name profilePic phNo');
        res.json({ success: true, room });
    } catch (error) {
        res.json({ success: false, error: error });
    }
});

// Fetch messages for a specific room
route.get("/messages/:roomId", fetchuser, async (req, res) => {
    const { roomId } = req.params;
    try {
        // Verify user is a member of the room
        const room = await ROOM.findById(roomId);
        if (!room) {
            return res.json({ success: false, error: "Room not found" });
        }

        const userId = req.user.id;
        if (!room.members.includes(userId)) {
            return res.json({ success: false, error: "Access denied" });
        }

        // Fetch messages for the room
        const messages = await MESSAGE.find({
            receiverId: roomId,
            receiverModel: 'ROOM'
        })
            .populate('senderId', 'name profilePic')
            .sort({ createdAt: 1 });

        res.json({ success: true, messages, room });
    } catch (error) {
        console.error("Error fetching room messages:", error);
        res.json({ success: false, error: error.message });
    }
});

route.get("/fetchnotmemberuser/:id", async (req, res) => {
    try {
        const roomid = req.params.id;

        if (!roomid) {
            return res.json({ success: false, error: "Room not found" });
        }
        const room = await ROOM.findById(roomid);
        if (!room) {
            return res.json({ success: false, error: "Invalid room ID" });
        }
        const users = await USER.find({ _id: { $nin: room.members } });

        return res.json({ success: true, users });
    } catch (error) {
        console.error("Error fetching room messages:", error);
        res.json({ success: false, error: error.message });
    }
})

// Add users to group room
route.post("/addusers/:id", fetchuser, async (req, res) => {
    try {
        const roomId = req.params.id;
        const { userIds } = req.body; // Array of user IDs to add
        const currentUserId = req.user.id;
        console.log(userIds);
        if (!roomId) {
            return res.json({ success: false, error: "Room ID is required" });
        }

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.json({ success: false, error: "User IDs are required" });
        }

        // Find the room and verify current user is a member
        const room = await ROOM.findById(roomId);
        if (!room) {
            return res.json({ success: false, error: "Room not found" });
        }

        if (room.createdBy.toString() !== currentUserId) {
            return res.status(403).json({
                success: false,
                error: "Only the group creator can add users"
            });
        }
        // Check if current user is a member of the room
        if (!room.members.includes(currentUserId)) {
            return res.json({ success: false, error: "You are not a member of this room" });
        }

        // Filter out users who are already members
        const newUserIds = userIds.filter(userId => !room.members.includes(userId));

        if (newUserIds.length === 0) {
            return res.json({ success: false, error: "All selected users are already members" });
        }

        // Verify all new users exist
        const newUsers = await USER.find({ _id: { $in: newUserIds } });
        if (newUsers.length !== newUserIds.length) {
            return res.json({ success: false, error: "Some users not found" });
        }

        // Add users to the room
        const updatedRoom = await ROOM.findByIdAndUpdate(
            roomId,
            { $addToSet: { members: { $each: newUserIds } } },
            { new: true }
        ).populate('members', 'name profilePic phNo');

        return res.json({
            success: true,
            message: "Users added successfully",
            room: updatedRoom,
            addedUsers: newUsers
        });
    } catch (error) {
        console.error("Error adding users to room:", error);
        res.json({ success: false, error: error.message });
    }
});


//remove user from member of roomid

route.post("/removemember/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { roomId } = req.body;

        if (!userId || !roomId) {
            return res.json({ success: false, error: "Ids not found" });
        }

        await ROOM.findByIdAndUpdate(roomId, {
            $pull: { members: userId },
        })
        // In your route or service after DB update
        const socketId = userSocketMap.get(userId);
        if (socketId) {
            io.sockets.sockets.get(socketId)?.leave(roomId);
        }

        res.status(200).json({ success: true, message: 'User removed from room successfully' });
    } catch (error) {
        console.error("Error adding users to room:", error);
        res.json({ success: false, error: error.message });
    }
})
module.exports = route;
