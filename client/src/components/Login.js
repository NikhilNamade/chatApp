import React, { useContext, useState } from 'react';
import assets from '../chat-app-assets/assets';
import { useNavigate } from 'react-router-dom';
import { Context } from "../Context/Context";
const Login = ({setProgress}) => {
  const { setAuth, setUserid } = useContext(Context);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phNo: '',
    password: ''
  });

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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phNo: formData.phNo, password: formData.password }),
      });
      const data = await response.json();
      if (data.success && data.jwtToken) {
        localStorage.setItem("jwtToken", data.jwtToken);
        setAuth(true);
        setUserid(data.user._id);
      }
      if (data.success) {
        navigate("/chat");
      }
      {setProgress(100)}

    } catch (error) {
      alert("Unable to Login");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {/* <img src={assets.logo_big} alt="QuickChat" className="logo" /> */}
        <h2>Welcome Back</h2>
        <p className="subtitle">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit}>
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
            LogIn
          </button>
        </form>

        <p className="toggle-text">
          Don't have an account?
          <span style={{color:"white"}} onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
