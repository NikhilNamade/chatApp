import React, { useState, useRef, useEffect, useContext } from 'react';
import assets from '../chat-app-assets/assets';
import { Context } from "../Context/Context";

const ChatMain = ({ selectedChat }) => {
  const { socket, userid, getOnlineuser, setviewProfile } = useContext(Context);
  const [selecteUser, setUser] = useState({});
  const [messages, setmessage] = useState([])
  const [messageText, setMessageText] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [ImgURL, setImgURL] = useState({ status: false, url: null });
  const [filePreview, setFilePreview] = useState({ status: false, url: null, name: null, type: null });
  const messagesEndRef = useRef(null); // This was missing!
  const fileInputRef = useRef(null);

  // const seen = async()=>{
  //   try{
  //     const response = await fetch(`http://localhost:5000/api/msg/mark/${selectedChat._id}`,{
  //       method:"PUT",
  //     });
  //     const data = await response.json();
  //   }catch(error){
  //     console.error(error);
  //   }
  // }
  // Auto-scroll to bottom when messages change

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


  const handleImage = () => {
    fileInputRef.current.click();
  }

  const handleChangeImage = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const isImage = fileType.startsWith('image/');

      if (isImage) {
        setImage(selectedFile);
        setFile(null);
      } else {
        setFile(selectedFile);
        setImage(null);
      }
    }
  }
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

  const ensureFileExtension = (filename, mimetype) => {
    const extMap = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/zip': '.zip',
      'application/json': '.json',
      'text/plain': '.txt',
      'text/html': '.html'
    };

    const hasExtension = /\.[0-9a-z]+$/i.test(filename);
    if (!hasExtension && extMap[mimetype]) {
      return filename + extMap[mimetype];
    }
    return filename;
  };

  const isPreviewableFile = (extension) => {
    const previewableTypes = ['pdf', 'txt', 'html', 'csv', 'json', 'docx'];
    return previewableTypes.includes(extension);
  };
  const downloadFile = (url, filename, mimetype) => {
    const finalFilename = ensureFileExtension(filename, mimetype);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', finalFilename || 'download');
    link.setAttribute('target', '_blank');
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
  const handleSendMessage = async () => {
    const formData = new FormData();
    formData.append("text", messageText);
    formData.append("receiverId", selectedChat._id);

    // Determine if this is a room or user message
    const isRoom = selectedChat.roomName !== undefined;
    formData.append("receiverModel", isRoom ? "ROOM" : "USER");

    if (image) {
      formData.append("media", image);
    }
    if (file) {
      formData.append("media", file);
    }
    try {
      const response = await fetch(`http://localhost:5000/api/msg/sendmsg`, {
        method: "POST",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setmessage([...messages, data.message]);
        setMessageText("")
        setImage(null);
        setFile(null);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const fetchbyid = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/fetchbyid/${selectedChat._id}`, {
        method: "GET",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        }
      });
      const data = await response.json();
      if (data) {
        setUser(data.user);
        setmessage(Array.isArray(data.message) ? data.message : []);
      }
      
    } catch (error) {
      console.error(error);
    }
  }

  const fetchroombyid = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/room/fetchbyid/${selectedChat._id}`, {
        method: "GET",
      });
      const data = await response.json();
      if (data) {
        setUser(data.room);
        // Don't clear messages here, we'll fetch them separately
      }
    } catch (error) {
      console.error(error);
    }
  }

  const fetchRoomMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/room/messages/${selectedChat._id}`, {
        method: "GET",
        headers: {
          "jwtToken": localStorage.getItem("jwtToken"),
        }
      });
      const data = await response.json();
      if (data.success) {
        setmessage(Array.isArray(data.messages) ? data.messages : []);
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
        fetchRoomMessages();
      } else {
        fetchbyid();
      }
    }
    // seen();
  }, [selectedChat]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages])

  useEffect(() => {
    if (!socket || !selectedChat?._id) return;

    const handleNewMessage = (msg) => {
      const isForCurrentChat =
        msg.senderId === selectedChat._id || msg.receiverId === selectedChat._id;

      if (isForCurrentChat) {
        setmessage(prev => [...prev, msg]);
      }
    };

    socket.on("newMsg", handleNewMessage);
    return () => socket.off("newMsg", handleNewMessage);
  }, [socket, selectedChat, messages]);
  return (
    <div className="chat-main">
      {
        selecteUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <img src={selecteUser.profilePic ? selecteUser.profilePic : assets.avatar_icon} alt="" className="chat-avatar" />
                <div className="chat-user-details">
                  <h3>{selecteUser.name || selecteUser.roomName}</h3>
                  {getOnlineuser[selecteUser._id] && <p className="online-status">Online</p>}

                </div>
              </div>
              {/* <div className="chat-actions">
                <img src={assets.help_icon} alt="Info" className="info-icon" />
              </div> */}
              <img src={assets.arrow_icon} className="back-icon" title='viewProfile' onClick={() => setviewProfile(true)} />
            </div>

            <div className="messages-container">
              <div className="messages-list">
                {Array.isArray(messages) && messages.map(msg => {
                  const isCurrentUser = msg.senderId === userid || msg.senderId?._id === userid;
                  const isGroupChat = selectedChat.roomName !== undefined;

                  return (
                    <div key={msg._id}
                      className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                    >

                      <div className="message-content">
                        {msg.text && <span className="message-text">{msg.text}</span>}
                        {msg.media && (
                          isImageFile(msg.mediaType) ? (
                            <img
                              src={msg.media}
                              alt="Sent attachment"
                              className="message-image"
                              onClick={() => handelImageOnclick(msg.media)}
                            />
                          ) : (
                            <div className="file-attachment">
                              <div className="file-info">
                                <span className="file-icon">{getFileIcon(getFileExtension(msg.mediaName))}</span>
                                <div className="file-details">
                                  <span className="file-name">{msg.mediaName || 'Unknown File'}</span>
                                  <span className="file-extension">{getFileExtension(msg.mediaName).toUpperCase()}</span>
                                </div>
                              </div>
                              <div className="file-actions">
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
                          )
                        )}
                      </div>

                      <div className="timestamp">
                        {!isGroupChat && (
                          <span className="message-avtar">
                            <img src={msg.senderId?.profilePic || assets.avatar_icon} alt="User" />
                          </span>
                        )}
                        {isGroupChat && !isCurrentUser && (
                          <div className="message-sender-info">
                            <span className="sender-name">{msg.senderId?.name || 'Unknown User'}</span>
                          </div>
                        )}
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                      </div>
                      {/* Show sender info for group chats and received messages */}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {ImgURL.status && (
              <div className="view-image">
                <div className="closeIcon" >
                  <img src={assets.closeIcon} onClick={handleImageclose} />
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
            {image && <div className="media-display-container">
              <img src={URL.createObjectURL(image)} />
            </div>}
            {file && <div className="file-display-container">
              <div className="file-preview-info">
                <span className="file-icon">{getFileIcon(getFileExtension(file.name))}</span>
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
                <button
                  className="remove-file-btn"
                  onClick={() => setFile(null)}
                >
                  ✕
                </button>
              </div>
            </div>}
            <div className="message-input-container">
              <div className="message-input">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  // onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="message-input-field"
                />
                <div className="input-actions">
                  <img src={assets.gallery_icon} alt="Gallery" onClick={handleImage} className="gallery-icon" />
                  <input type="file" id="file" ref={fileInputRef} onChange={handleChangeImage} style={{ display: 'none' }} accept="*/*" />
                  <img
                    src={assets.send_button}
                    alt="Send"
                    className="send-icon"
                    onClick={handleSendMessage}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <img src={assets.logo_icon} alt="QuickChat" className="welcome-logo" />
            <h2>Welcome to QuickChat</h2>
            <p>Select a chat to start messaging</p>
          </div>
        )
      }
    </div>
  );
};

export default ChatMain;
