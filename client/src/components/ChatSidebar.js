import React, { useContext, useEffect, useState } from 'react';
import assets from '../chat-app-assets/assets';
import { useNavigate } from "react-router-dom";
import { Context } from "../Context/Context";
const ChatSidebar = ({ setSelectedChat, selectedChat,setProgress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [group, setGroup] = useState(false);
  let { setAuth,room,fetchRoom, setScoketState, setUserid,userid, getOnlineuser, usercurent, fetchUser, fetchALLUser, filteredUsers, unseen, setRoomnmember,roomName,setRoomname,roomMember,createRoom } = useContext(Context);
  const naviagte = useNavigate();
  const logout = () => {
    setProgress(50);
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("Socket");
    localStorage.removeItem("userid");
    setAuth(false);
    setScoketState(null);
    setUserid(null);
    naviagte("/");
    setProgress(100);
  }

  // filteredUsers = filteredUsers.filter(u =>
  //   u.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  filteredUsers = filteredUsers.sort((a, b) => {
    const aOnline = getOnlineuser[a._id] ? 1 : 0;
    const bOnline = getOnlineuser[b._id] ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline;
    return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
  });

  const onSelectChat = (chatUser) => {
    setSelectedChat(chatUser);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchALLUser();
    fetchRoom();
  }, [selectedChat]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className="chat-sidebar">
      {usercurent &&
        (
          <div className="sidebar-header">
            <div className="user-info">
              <img src={usercurent.profilePic ? usercurent.profilePic : assets.avatar_icon} alt="user profile" className="user-avatar" />
              <div className="user-details">
                <h3>{usercurent.name}</h3>
                <p className="user-status">Online</p>
              </div>
            </div>
            <div className="header-actions" onClick={logout}>
              LogOut
            </div>
          </div>
        )
      }
      <div className="search-container">
        <div className="search-box">
          <img src={assets.search_icon} alt="Search" className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="createGroup" onClick={() => setGroup(true)}>Create Group</button>
        </div>
      </div>

      <div className="chat-list">
        {filteredUsers.map(chatUser => (
          <div
            key={chatUser._id}
            className={`chatUser chat-item ${selectedChat?._id === chatUser._id ? 'active' : ''}`}
            onClick={() => onSelectChat(chatUser)}
          >
            <div className="chat-avatar">
              <img src={chatUser.profilePic ? chatUser.profilePic : assets.avatar_icon} alt={chatUser.name} />
              {
                getOnlineuser[chatUser._id] && <div className="online-indicator"></div>
              }
            </div>
            <div className="chat-info">
              <div className="chat-header" style={{ backgroundColor: "transparent" }}>
                <h4 style={{ color: "white" }}>{chatUser.name}</h4>
                <span className="chat-time">{formatTime(chatUser.lastSeen)}</span>
                {unseen && unseen[chatUser._id] > 0 ? (
                  <span className="chat-unseen">{unseen[chatUser._id]}</span>
                ) : null}

              </div>
              {/* <p className="last-message">{chatUser.bio}</p> */}
            </div>
          </div>
        ))}

        {
          room.map(groups => (
            <div
            key={groups._id}
            className={`chatUser chat-item ${selectedChat?._id === groups._id ? 'active' : ''}`}
            onClick={() => onSelectChat(groups)}
          >
            <div className="chat-avatar">
              <img src={groups.profilePic ? groups.profilePic : assets.avatar_icon} alt={groups.roomName} />
              {
                getOnlineuser[groups._id] && <div className="online-indicator"></div>
              }
            </div>
            <div className="chat-info">
              <div className="chat-header" style={{ backgroundColor: "transparent" }}>
                <h4 style={{ color: "white" }}>{groups.roomName}</h4>
                {/* <span className="chat-time">{formatTime(groups.lastSeen)}</span> */}
                {/* {unseen && unseen[chatUser._id] > 0 ? (
                  <span className="chat-unseen">{unseen[chatUser._id]}</span>
                ) : null} */}

              </div>
              {/* <p className="last-message">{chatUser.bio}</p> */}
            </div>
          </div>
          ))
        }
      </div>

      {
        group && (
          <>
            <div className="makeGroup">
              <div className="closeIcon" >
                <img src={assets.closeIconWhite} onClick={() => setGroup(false)} />
              </div>
              <input
                type="text"
                placeholder="Group Name"
                className="search-input"
                onChange={(e) => setRoomname(e.target.value)}
              />
              <div className="chat-list">
                {filteredUsers.map(chatUser => (
                  <div
                    key={chatUser._id}
                    className={`chatUser chat-item ${selectedChat?._id === chatUser._id ? 'active' : ''}`}

                  >
                    <input type="checkbox" className='checkbox'
                      onChange={() => setRoomnmember((id)=>[...id,chatUser._id])} />
                    <div className="chat-avatar">
                      <img src={chatUser.profilePic ? chatUser.profilePic : assets.avatar_icon} alt={chatUser.name} />
                      {
                        getOnlineuser[chatUser._id] && <div className="online-indicator"></div>
                      }
                    </div>
                    <div className="chat-info">
                      <div className="chat-header" style={{ backgroundColor: "transparent" }}>
                        <h4 style={{ color: "white" }}>{chatUser.name}</h4>
                        <span className="chat-time">{formatTime(chatUser.lastSeen)}</span>
                        {unseen && unseen[chatUser._id] > 0 ? (
                          <span className="chat-unseen">{unseen[chatUser._id]}</span>
                        ) : null}

                      </div>
                      {/* <p className="last-message">{chatUser.bio}</p> */}
                    </div>
                  </div>
                ))}

                <div className="buttongroup" onClick={()=>{createRoom();setGroup(false);setRoomname(null);setRoomnmember([userid])}}>Create Group</div>
              </div>

            </div>
          </>
        )
      }
    </div>
  );
};

export default ChatSidebar;
