import { createContext, useContext, useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const backendUrl = "http://127.0.0.1:5000/chat";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const processingRef = useRef(false);

  // Generate new conversation ID on page load
  useEffect(() => {
    setConversationId(uuidv4());
  }, []);

  const chat = async (message) => {
    setLoading(true);
    
    try {
      // Convert request to GET with query parameters
      const url = new URL(backendUrl);
      url.searchParams.append('query', message);
      url.searchParams.append('conversation_id', conversationId);
      
      const data = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Data:", data);

      const textResponse = await data.text(); // Get response as text first
      
      console.log("Text response:", textResponse);
      
      try {
        // Try to parse the response as JSON
        const resp = JSON.parse(textResponse);
        console.log("Parsed response:", resp);
        
        // Check if resp.messages exists and is an array
        if (resp.messages && Array.isArray(resp.messages)) {
          setMessages(prev => [...prev, ...resp.messages]);
        } else if (resp.error && resp.raw_response) {
          // Handle the case where the server returns an error with raw_response
          console.error("API Error:", resp.error);
          
          // Clean up the raw_response by removing the dashes and any other non-JSON prefix
          try {
            const cleanedResponse = resp.raw_response.replace(/^[^{]*/, '');
            const parsedRawResponse = JSON.parse(cleanedResponse);
            
            if (parsedRawResponse.messages && Array.isArray(parsedRawResponse.messages)) {
              setMessages(prev => [...prev, ...parsedRawResponse.messages]);
            } else {
              console.error("No valid messages in cleaned response:", parsedRawResponse);
              setMessages(prev => [...prev, {
                text: "Sorry, I couldn't process your message correctly.",
                facialExpression: "sad",
                animation: "Talking_0"
              }]);
            }
          } catch (rawParseError) {
            console.error("Error parsing cleaned raw_response:", rawParseError);
            console.log("Cleaned response attempt failed, raw content:", resp.raw_response);
            setMessages(prev => [...prev, {
              text: "I encountered an error processing your message. Please try again.",
              facialExpression: "sad",
              animation: "Talking_0"
            }]);
          }
        } else {
          console.error("Unexpected response format:", resp);
          setMessages(prev => [...prev, {
            text: "I received an unexpected response format. Please try again.",
            facialExpression: "confused",
            animation: "Talking_0"
          }]);
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Raw response:", textResponse);
        
        // Try to directly extract and parse the response if initial parsing fails
        try {
          // Remove any non-JSON prefix (like dashes)
          const cleanedResponse = textResponse.replace(/^[^{]*/, '');
          const parsedResponse = JSON.parse(cleanedResponse);
          
          if (parsedResponse.messages && Array.isArray(parsedResponse.messages)) {
            setMessages(prev => [...prev, ...parsedResponse.messages]);
          } else {
            setMessages(prev => [...prev, {
              text: "I had trouble understanding the response. Please try again.",
              facialExpression: "confused",
              animation: "Talking_0"
            }]);
          }
        } catch (secondaryParseError) {
          console.error("Secondary parse attempt failed:", secondaryParseError);
          setMessages(prev => [...prev, {
            text: "I couldn't process the response correctly. Please try again.",
            facialExpression: "sad",
            animation: "Talking_0"
          }]);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        text: "Sorry, there was an error connecting to the server. Please check your connection and try again.",
        facialExpression: "sad",
        animation: "Talking_0"
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Process messages queue
  useEffect(() => {
    if (!isPlaying && messages.length > 0 && !processingRef.current) {
      processingRef.current = true;
      const nextMessage = messages[0];
      setMessage(nextMessage);
      setIsPlaying(true);
    }
  }, [messages, isPlaying]);

  const onMessagePlayed = () => {
    setIsPlaying(false);
    processingRef.current = false;
    setMessages(prev => prev.slice(1));
    setMessage(null);
  };

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
        conversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
