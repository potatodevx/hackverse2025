import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

// StoredChatViewer Component - Modified to display HTML responses directly
function StoredChatViewer() {
  const [chatHistory, setChatHistory] = useState([]);
  const [htmlResponses, setHtmlResponses] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const chatViewerRef = useRef(null);

  // Function to load data from localStorage
  const loadStoredData = useCallback(() => {
    try {
      // Get the current conversation ID
      const currentId = localStorage.getItem('currentConversationId') || '';
      setConversationId(currentId);
      
      // Get the user messages
      const userQueries = JSON.parse(localStorage.getItem('userQueries') || '[]');
      
      // Get the HTML responses
      const storedHtmlResponses = JSON.parse(localStorage.getItem('htmlResponses') || '[]');
      
      // If we have HTML responses, format them for display
      if (storedHtmlResponses.length > 0) {
        setHtmlResponses(storedHtmlResponses);
      }
      
      // Combine user queries and HTML responses into a single timeline
      // based on timestamps for display
      const combinedChat = [];
      
      // Add user messages
      userQueries.forEach(query => {
        combinedChat.push({
          type: 'user',
          content: query.query,
          timestamp: query.timestamp
        });
      });
      
      // Add HTML responses
      storedHtmlResponses.forEach(response => {
        combinedChat.push({
          type: 'bot',
          content: response.html_response,
          timestamp: response.timestamp
        });
      });
      
      // Sort by timestamp
      combinedChat.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setChatHistory(combinedChat);
    } catch (error) {
      console.error("Error loading chat data from localStorage:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStoredData();
    
    // Scroll to bottom on initial load
    if (chatViewerRef.current) {
      chatViewerRef.current.scrollTop = chatViewerRef.current.scrollHeight;
    }
  }, [loadStoredData]);
  
  // Setup a listener to detect localStorage changes
  useEffect(() => {
    // Function to handle storage events
    const handleStorageChange = (e) => {
      if (e.key === 'userQueries' || e.key === 'htmlResponses' || e.key === 'currentConversationId') {
        loadStoredData();
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes (as storage event only fires in other tabs)
    const intervalId = setInterval(loadStoredData, 1000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [loadStoredData]);
  
  // Scroll to bottom when chat history changes
  useEffect(() => {
    if (chatViewerRef.current) {
      chatViewerRef.current.scrollTop = chatViewerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Alternative approach: Try to extract raw response directly from the lastRawApiResponse
  useEffect(() => {
    const checkForLatestHtmlResponse = () => {
      try {
        const rawResponse = localStorage.getItem('lastRawApiResponse');
        if (rawResponse) {
          // Try to extract HTML response from the raw response
          const match = rawResponse.match(/\"html_response\":\s*\"(.*?)\"/);
          if (match && match[1]) {
            // Replace escaped quotes and newlines
            let htmlContent = match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
            
            // Store this HTML response if it's not already in our list
            setHtmlResponses(prev => {
              const exists = prev.some(item => item.html_response === htmlContent);
              if (!exists) {
                const newResponse = {
                  html_response: htmlContent,
                  timestamp: new Date().toISOString()
                };
                
                // Also update localStorage
                const storedResponses = JSON.parse(localStorage.getItem('htmlResponses') || '[]');
                if (!storedResponses.some(item => item.html_response === htmlContent)) {
                  storedResponses.push(newResponse);
                  localStorage.setItem('htmlResponses', JSON.stringify(storedResponses));
                }
                
                return [...prev, newResponse];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Error extracting HTML response:", error);
      }
    };
    
    // Check on mount and periodically
    checkForLatestHtmlResponse();
    const intervalId = setInterval(checkForLatestHtmlResponse, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="absolute left-0 top-0 bottom-0 z-20 w-[350px] bg-gradient-to-r from-purple-900/70 to-purple-800/50 backdrop-blur-md text-white p-4 shadow-xl flex flex-col h-full">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-purple-300">
          Virtual Girlfriend
        </h2>
        {conversationId && (
          <p className="text-xs text-purple-300 mt-1">
            Conversation ID: {conversationId.substring(0, 8)}...
          </p>
        )}
      </div>
      
      {/* Chat message history */}
      <div 
        ref={chatViewerRef}
        className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent mb-4 px-2"
      >
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-purple-300 opacity-70">
            <p>No messages found in storage...</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div 
              key={index} 
              className={`message mb-4 ${msg.type === 'bot' ? 'bot-message' : 'user-message text-right'}`}
            >
              {msg.type === 'user' ? (
                <div className="rounded-2xl rounded-tr-none bg-blue-600/70 p-3 max-w-[85%] inline-block">
                  {msg.content}
                  <span className="block text-xs mt-1 opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl rounded-tl-none bg-purple-600/70 p-3 max-w-[85%] inline-block">
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  <span className="block text-xs mt-1 opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Latest HTML response if one exists but not in the chat history yet */}
        {htmlResponses.length > 0 && 
          !chatHistory.some(msg => 
            msg.type === 'bot' && 
            msg.content === htmlResponses[htmlResponses.length - 1].html_response
          ) && (
          <div className="message bot-message mb-4">
            <div className="rounded-2xl rounded-tl-none bg-purple-600/70 p-3 max-w-[85%] inline-block">
              <div dangerouslySetInnerHTML={{ 
                __html: htmlResponses[htmlResponses.length - 1].html_response 
              }} />
              <span className="block text-xs mt-1 opacity-50">
                {new Date(htmlResponses[htmlResponses.length - 1].timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
        
        {/* Use StoredChatViewer instead of the chat input UI */}
        <StoredChatViewer />
        
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
        <Route path="/ai-agent" element={<AIAgent />} /> {/* New route for AI Agent */}
      </Routes>
    </Router>
  );
}

export default App;