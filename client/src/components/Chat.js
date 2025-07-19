import React, { useState, useEffect,useContext } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import ProfileInfo from './ProfileInfo';
import assets from '../chat-app-assets/assets';
import { Context } from "../Context/Context";
const Chat = ({setProgress}) => {
  const [selectedChat, setSelectedChat] = useState({});
  const { viewProfile } = useContext(Context);
  return (
    <div className="chat-bgImage">
      {/* <div className="main-area">
        <div className="circles">
          <div><img src={assets.cool} /></div>
          <div><img src={assets.happyface} /></div>
          <div><img src={assets.confused} /></div>
          <div><img src={assets.jod} /></div>
          <div><img src={assets.thinking} /></div>
          <div><img src={assets.cool} /></div>
          <div><img src={assets.happyface} /></div>
          <div><img src={assets.confused} /></div>
          <div><img src={assets.jod} /></div>
          <div><img src={assets.thinking} /></div>
        </div>
      </div> */}
      <div className="chat-container">
        <ChatSidebar setSelectedChat={setSelectedChat} selectedChat={selectedChat} setProgress={setProgress}/>

        {viewProfile ? 
        (
          <ProfileInfo selectedChat={selectedChat} />
        ):(
          <ChatMain selectedChat={selectedChat} />
        )}
        
       

      </div>


    </div>
  );
};

export default Chat;
