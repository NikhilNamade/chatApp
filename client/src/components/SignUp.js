import React, { useState,useContext, useRef } from 'react';
import assets from '../chat-app-assets/assets';
import { useNavigate } from 'react-router-dom';
import { Context } from "../Context/Context";
const SignUp = ({setProgress}) => {
  const { setAuth, setUserid } = useContext(Context);
  const navigate = useNavigate();
  const  fileInputRef = useRef(null);
  const [profilePic,setProfilePic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phNo: '',
    password: ''
  });


  const handleImage = ()=>{
    fileInputRef.current.click();
  }


  const handleChangeImage = (e) => {
    const selectedFile = e.target.files[0];
    setProfilePic(selectedFile);
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    {setProgress(50)}
    try {
      const formdata = new FormData();
      formdata.append("name",formData.name);
      formdata.append("phNo",formData.phNo);
      formdata.append("password",formData.password);
      if(profilePic){
        formdata.append("profilePic",profilePic);
      }
      const response = await fetch("https://chatapp-hzz6.onrender.com/api/auth/register", {
        method: "POST",
        body: formdata,
      });
      const data = await response.json();
      if(data.jwtToken){
        localStorage.setItem("jwtToken",data.jwtToken);
        setAuth(true);
        setUserid(data.user._id);
      }
      if (data.success) {
        navigate("/chat");
      }
      {setProgress(100)}
    } catch (error) {
      alert("Unable to SignUp");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {/* <img src={assets.logo_big} alt="QuickChat" className="logo" /> */}
        <h2>Create Account</h2>
        <p className="subtitle">
          Sign up to get started
        </p>

        <form onSubmit={handleSubmit}>
        <div className="input-group">
        <img src={profilePic ? URL.createObjectURL(profilePic) : assets.avatar_icon} alt="Gallery" onClick={handleImage} className="profile-img" />
        <p>Upload Profile Image</p>
            <input
              type="file"
              ref={fileInputRef}
              style={{display:"none"}}
              onChange={handleChangeImage}
              accept="image/*"
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="number"
              name="phNo"
              placeholder="Phone Number"
              value={formData.phNo}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <p className="toggle-text">
          Already have an account?
          <span style={{color:"white"}} onClick={() => navigate("/")}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
