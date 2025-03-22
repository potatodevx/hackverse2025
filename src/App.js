import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import Main from './components/Main';
import Home from './components/Home';
import M1 from "./components/M1";
import M2 from "./components/M2";
import Cart from "./components/Cart";
import Cart1 from "./components/Cart1";

// AI Agent Component
function AIAgent() {
  useEffect(() => {
    // Extract the `userid` from the URL
    const urlParts = window.location.pathname.split('/');
    const userid = urlParts[1];
    console.log(userid, urlParts);
    if (userid) {
      localStorage.setItem('gfuserid', userid);
      console.log('userid stored in localStorage: ', userid);
    } else {
      console.log('User not found..!');
    }
  }, []);

  return (
    <>
      <Loader />
      <Leva hidden />
      {/* Add a wrapper to manage relative positioning */}
      <div className="relative w-full h-full">
        <Canvas
          shadows
          camera={{ position: [0, 0, 1], fov: 30 }}
          className="absolute inset-0 z-0"
        >
          <Experience />
        </Canvas>
        {/* Ensure UI is layered above the Canvas */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <UI />
        </div>
      </div>
    </>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/home" element={<Home />} />
        <Route path="/m1" element={<M1 />} />
        <Route path="/m2" element={<M2 />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/cart/:id" element={<Cart1 />} />
        <Route path="/ai-agent" element={<AIAgent />} /> {/* New route for AI Agent */}
      </Routes>
    </Router>
  );
}

export default App;