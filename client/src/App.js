import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Chat from './components/Chat';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import { ContextProvider } from './Context/Context';
import LoadingBar from "react-top-loading-bar";


function RouteApp({setProgress}) {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token && window.location.pathname == "/") {
      navigate("/chat");
    }
  }, []);

  return (
    <Routes>
      <Route path='/' element={<Login setProgress={setProgress}/>} />
      <Route path='/chat' element={<Chat setProgress={setProgress}/>} />
      <Route path='/signup' element={<SignUp setProgress={setProgress}/>} />
    </Routes>
  )
}
function App() {
  const [progress, setProgress] = useState(0);
  return (
    <div className="app">
      <LoadingBar
        color='#f11946'
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      ></LoadingBar>
      <ContextProvider>
        <BrowserRouter>
          <RouteApp setProgress={setProgress} />
        </BrowserRouter>
      </ContextProvider>
    </div>
  );
}


export default App;
