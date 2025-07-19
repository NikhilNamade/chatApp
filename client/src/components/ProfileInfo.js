import React, { useEffect, useState, useContext } from 'react';
import assets from '../chat-app-assets/assets';
import { Context } from "../Context/Context";

const ProfileInfo = ({ selectedChat }) => {
  const { setviewProfile, userid } = useContext(Context);
  const [selecteUser, setUser] = useState({});
  const [messages, setMessages] = useState([]);
  const [adduser, setadduser] = useState(false);
  const [notinroom, setnotinroom] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [ImgURL, setImgURL] = useState({ status: false, url: null });
  const [filePreview, setFilePreview] = useState({ status: false, url: null, name: null, type: null });
  const handleImageclose = () => {
    setImgURL({ status: false, url: null });
  }

  const handleFilePreviewClose = () => {
    setFilePreview({ status: false, url: null, name: null, type: null });
  }

  const handelImageOnclick = (imgURL) => {
    setImgURL({ status: true, url: imgURL });
  }

  const handleFileClick = (fileURL, fileName, fileType) => {
    setFilePreview({ status: true, url: fileURL, name: fileName, type: fileType });
  }

  const getFileExtension = (filename) => {
    if (!filename) return 'unknown';
    return filename.split('.').pop().toLowerCase();
  };

  const getFileIcon = (extension) => {
    const iconMap = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📊', pptx: '📊',
      txt: '📄',
      zip: '📦', rar: '📦',
      mp4: '🎥', avi: '🎥', mov: '🎥',
      mp3: '🎵', wav: '🎵',
      js: '📜', html: '📜', css: '📜',
      json: '📋',
      default: '📁'
    };
    return iconMap[extension] || iconMap.default;
  };

  const isPreviewableFile = (extension) => {
    const previewableTypes = ['pdf', 'txt', 'html', 'csv', 'json', 'docx'];
    return previewableTypes.includes(extension);
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = (mediaType) => {
    if (mediaType) {
      return mediaType.startsWith('image/');
    }
    return false;
  };

  const handelremove = async(id)=>{ 
    const response = await fetch(`https://chatapp-hzz6.onrender.com/api/room/removemember/${id}`,{
      method:"POST",
      headers:{
        "Content-Type" : "application/json",
      },
      body : JSON.stringify({roomId : selectedChat._id}),
    });
    const data = await response.json();
    if(data.success){
      alert("User Remove From Group");
    }else{
      alert("Unable to remove user");
    }
  }
  const fetchbyid = async () => {
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
        setMessages(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const fetchroombyid = async () => {
    try {
      const response = await fetch(`https://chatapp-hzz6.onrender.com/api/room/fetchbyid/${selectedChat._id}`, {
        method: "GET",
      });
      const data = await response.json();
      if (data) {
        setUser(data.room);
        // For groups, fetch messages to show media
        fetchRoomMessages();
      }
    } catch (error) {
      console.error(error);
    }
  }

  const fetchRoomMessages = async () => {
    try {
      const response = await fetch(`https://chatapp-hzz6.onrender.com/api/room/messages/${selectedChat._id}`, {
        method: "GET",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const fetchusernotinroom = async () => {
    try {
      const response = await fetch(`https://chatapp-hzz6.onrender.com/api/room/fetchnotmemberuser/${selectedChat._id}`, {
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        setnotinroom(data.users);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleAddUsersToGroup = async () => {
    try {
      const response = await fetch(`https://chatapp-hzz6.onrender.com/api/room/addusers/${selectedChat._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "jwtToken": localStorage.getItem("jwtToken"),
        },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      const data = await response.json();
      if (data.success) {
        alert("User added Successfully");
        setadduser(false);
      } else {
        alert("Not allowed to add user");
      }
    } catch (error) {
      console.error(error);
    }
  }


  useEffect(() => {
    if (selectedChat) {
      // Check if it's a room or user chat
      const isRoom = selectedChat.roomName !== undefined;

      if (isRoom) {
        fetchroombyid();
      } else {
        fetchbyid();
      }
    }
  }, [selectedChat]);
  return (
    <div className="profile-info" >
      {
        selecteUser ? (
          <>
            <div className="profile-header">
              <img src={assets.arrow_icon} className="back-icon" style={{ rotate: "0deg" }} title='viewProfile' onClick={() => setviewProfile(false)} />
              <h2>Profile</h2>
            </div>
            <div style={{ display: "flex", alignItems: 'center', justifyContent: "space-evenly", height: "40%", width: "100%" }}>
              <div className="profile-content">
                <div className="profile-image-container">
                  <img src={selecteUser.profilePic ? selecteUser.profilePic : assets.avatar_icon} alt="" className="profile-image" />
                </div>

                <div className="profile-details">
                  <h3>{selecteUser.name || selecteUser.roomName}</h3>
                  <p className="profile-email">{selecteUser.phNo || selecteUser.roomId}</p>
                  <p className="profile-bio">bio</p>
                </div>
              </div>
              <div className="profile-actions">
                <div className="action-item">
                  <img src={assets.help_icon} alt="Help" className="action-icon" />
                  <span>Help</span>
                </div>
              </div>
            </div>

            {/* Group Members Section - Only show for groups */}
            {selecteUser.roomName && selecteUser.members && (
              <div className="group-members">
                <div className="group-header">
                  <h3>Group Members ({selecteUser.members.length})</h3>
                  {selecteUser.createdBy == userid && (<button onClick={() => { setadduser(true); fetchusernotinroom(); }}>Add New User</button>)}
                </div>
                <div className="members-list">
                  {selecteUser.members.map((member, index) => (
                    <div key={index} className="member-item">
                      <img
                        src={member.profilePic || assets.avatar_icon}
                        alt={member.name}
                        className="member-avatar"
                      />
                      <div className="member-info">
                        <p className="member-name">{member.name}</p>
                        <p className="member-phone">{member.phNo}</p>
                      </div>
                      {
                        selecteUser.createdBy == member._id && (<p style={{ color: "greenyellow" }}>Admin</p>)
                      }
                      {
                        selecteUser.createdBy != member._id && (<p style={{ color: "red"}} onClick={()=> handelremove(member._id)}>Remove</p>)
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="user-media">
              {Array.isArray(messages) && messages.map((msg, index) => (
                msg.media && (
                  <div key={index} className="media">
                    {isImageFile(msg.mediaType) ? (
                      <div onClick={() => handelImageOnclick(msg.media)} className="media-image">
                        <img src={msg.media} alt="Media" />
                      </div>
                    ) : (
                      <div className="media-file">
                        <div className="file-media-info">
                          <span className="file-icon">{getFileIcon(getFileExtension(msg.mediaName))}</span>
                          <div className="file-media-details">
                            <span className="file-name">{msg.mediaName || 'Unknown File'}</span>
                            <span className="file-extension">{getFileExtension(msg.mediaName).toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="file-media-actions">
                          {isPreviewableFile(getFileExtension(msg.mediaName)) && (
                            <button
                              className="media-preview-btn"
                              onClick={() => handleFileClick(msg.media, msg.mediaName, getFileExtension(msg.mediaName))}
                              title="Preview"
                            >
                              👁️
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
            {ImgURL.status && (
              <div className="view-image">
                <div className="closeIcon" >
                  <img src={assets.closeIconWhite} onClick={handleImageclose} />
                </div>
                <img src={ImgURL.url} className="actual-view-img" />
              </div>
            )
            }
            {filePreview.status && (
              <div className="file-preview-modal">
                <div className="file-preview-header">
                  <h3>{filePreview.name}</h3>
                  <button className="close-preview-btn" onClick={handleFilePreviewClose}>
                    ✕
                  </button>
                </div>
                <div className="file-preview-content">
                  <iframe
                    src={filePreview.url}
                    width="100%"
                    height="600px"
                    title={filePreview.name}
                    style={{ border: 'none' }}
                  />
                </div>
                <div className="file-preview-actions">
                  <button
                    className="download-btn"
                    onClick={() => downloadFile(filePreview.url, filePreview.name)}
                  >
                    📥 Download
                  </button>
                </div>
              </div>
            )
            }

            {adduser && (<div className="addUser">
              <div className="closeIcon" >
                <img src={assets.closeIcon} onClick={() => setadduser(false)} />
                <div className="members-list">
                  {
                    Array.isArray(notinroom) && notinroom.map((user) => (
                      <div key={user._id} className="member-item">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user._id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user._id));
                            }
                          }}
                        />
                        <img
                          src={user.profilePic || assets.avatar_icon}
                          alt={user.name}
                          className="member-avatar"
                        />
                        <div className="member-info">
                          <p className="member-name" style={{ color: "black" }}>{user.name}</p>
                          <p className="member-phone" style={{ color: "black" }}>{user.phNo}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <button className="buttonadduser" onClick={handleAddUsersToGroup} disabled={selectedUserIds.length === 0}>Add Users to group</button>
              </div>
            </div>)}
          </>
        ) : (
          <>
            <div className="profile-header">
              <img src={assets.arrow_icon} className="back-icon" title='viewChat' onClick={() => setviewProfile(true)} />
              <h2>Profile</h2>
            </div>

            <div className="profile-content">
              <div className="profile-image-container">
                <img src={assets.avatar_icon} alt="" className="profile-image" />
              </div>

              <div className="profile-details">
                <h3>fullName</h3>
                <p className="profile-email">Phone Number</p>
              </div>

              <div className="profile-actions">
                <div className="action-item">
                  <img src={assets.help_icon} alt="Help" className="action-icon" />
                  <span>Help</span>
                </div>
                <div className="action-item">
                  <img src={assets.gallery_icon} alt="Media" className="action-icon" />
                  <span>Media</span>
                </div>
              </div>
            </div>
          </>
        )
      }
    </div >
  );
};

export default ProfileInfo;
