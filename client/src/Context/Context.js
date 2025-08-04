import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
export const Context = createContext();

export const ContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("jwtToken"));
  const [isAuth, setAuthState] = useState(() => {
    return localStorage.getItem("isAuth") === "true";
  });
  const [socket, setSocket] = useState("");
  const [userid, setUseridState] = useState(() => localStorage.getItem("userid"));
  const [getOnlineuser, setGetOnlineuser] = useState({});
  const [roomName, setRoomname] = useState(null);
  const [roomMember, setRoomnmember] = useState([userid]);
  const [viewProfile, setviewProfile] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  // Wrap setAuth to persist value
  const setAuth = (value) => {
    setAuthState(value);
    localStorage.setItem("isAuth", value);
  };

  const setScoketState = (value) => {
    setSocket(value);
    localStorage.getItem("Socket", value);
  }

  const setUserid = (id) => {
    setUseridState(id);
    localStorage.setItem("userid", id);
  };
  const connectSocket = () => {
    if (!isAuth || socket?.connected || !userid) return;

    const newSocket = io("https://chatapp-hzz6.onrender.com", {
      query: {
        userId: userid,
      },
      transports: ["websocket"],  // <- force WebSocket only
    });    
    newSocket.connect();
    setSocket(newSocket);

  }

  const createRoom = () => {
    if (roomName && roomMember.length > 2) {
      socket.emit("createRoom", {
        roomName: roomName,
        users: roomMember,
        creator : userid,
      }, (res) => {
        if (res.success) {
          console.log("Room created:", res.room.roomId);
          // Show group in UI
        } else {
          console.error("Group creation failed:", res.message);
        }
      });
    }
  }



  // useEffect(() => {
  //   if (roomName && roomMember.length > 2  && !roomCreated) {
  //     createRoom();
  //     setRoomCreated(true); // prevent re-triggering
  //   }
  // }, [roomCreated]);


  useEffect(() => {
    if (!socket) return;

    socket.on("getOnlineUser", (onlineUsersArray) => {
      // Convert array to a lookup map
      const onlineUserMap = {};
      onlineUsersArray.forEach(userId => {
        onlineUserMap[userId] = true;
      });

      setGetOnlineuser(onlineUserMap); // This goes to your useState
    });

    return () => socket.off("getOnlineUser");
  }, [socket]);

  useEffect(() => {
    if (isAuth && userid) {
      connectSocket();
    }

    if (!isAuth && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [isAuth, userid]);


  //chatsidebar
  const [usercurent, setUsercurent] = useState({ name: "", phNo: "" });
  const [filteredUsers, setfilteredUsers] = useState([]);
  const [room,setRoom] = useState([]);
  const [unseen, setunseen] = useState({});
  const fetchUser = async () => {
    try {
      const response = await fetch("https://chatapp-hzz6.onrender.com/api/auth/fetchcurrentuser", {
        method: "GET",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        },
      });
      const data = await response.json();
      if (data) {
        setUsercurent(data.user);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const fetchALLUser = async () => {
    try {
      const response = await fetch("https://chatapp-hzz6.onrender.com/api/auth/fecthalluser", {
        method: "GET",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        },
      });
      const data = await response.json();
      if (data) {
        setfilteredUsers(data.users);
        setunseen(data.unseenmsg);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const fetchRoom = async()=>{
    try {
      const response = await fetch("https://chatapp-hzz6.onrender.com/api/room/fetchroom",{
        method:"GET",
        headers:{
          "jwtToken": localStorage.getItem("jwtToken"),
        }
      });
      const data = await response.json();
      if(data){
        setRoom(data.rooms);
      }
    } catch (error) {
      console.log(error);
    }
  }
  //chatMain
  const [selecteUser, setUser] = useState({});
  const [messages, setmessage] = useState([]);
  const fetchbyid = async ({ selectedChat }) => {
    try {
      const response = await fetch(`https://chatapp-hzz6.onrender.com/api/auth/fetchbyid/${selectedChat._id}`, {
        method: "GET",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        }
      });
      const data = await response.json();
      if (data) {
        setUser(data.user);
        setmessage(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <Context.Provider value={{ viewProfile, setviewProfile, setAuth, setScoketState, getOnlineuser, socket, userid, usercurent, fetchUser, filteredUsers, fetchALLUser, selecteUser, messages, fetchbyid, setmessage, unseen, setUserid, setRoomname, setRoomnmember, roomName, roomMember, createRoom,fetchRoom,room }}>
      {children}
    </Context.Provider>
  );
}
