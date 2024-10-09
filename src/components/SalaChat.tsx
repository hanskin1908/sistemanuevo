import React, { useState, useEffect, useRef } from 'react';
import { Send, Video, VideoOff } from 'lucide-react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const SalaChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const socketRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Generar un ID de usuario único si no existe
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
    }

    // Generar un ID de sala único si no existe
    const storedRoomId = localStorage.getItem('roomId');
    if (storedRoomId) {
      setRoomId(storedRoomId);
    } else {
      const newRoomId = uuidv4();
      setRoomId(newRoomId);
      localStorage.setItem('roomId', newRoomId);
    }
  }, []);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current.emit('joinRoom', { roomId, userId });
    });

    socketRef.current.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, userId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      const messageData = {
        userId,
        text: inputMessage,
        timestamp: new Date().toISOString(),
      };
      socketRef.current.emit('sendMessage', { roomId, message: messageData });
      setInputMessage('');
    }
  };

  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsVideoEnabled(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    } else {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsVideoEnabled(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              msg.userId === userId ? 'bg-blue-500 text-white self-end' : 'bg-gray-300'
            }`}
          >
            <p>{msg.text}</p>
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white">
        <form onSubmit={sendMessage} className="flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 border rounded-l-lg p-2"
            placeholder="Escribe un mensaje..."
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r-lg"
          >
            <Send size={20} />
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            className={`ml-2 p-2 rounded-lg ${
              isVideoEnabled ? 'bg-red-500' : 'bg-green-500'
            } text-white`}
          >
            {isVideoEnabled ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </form>
      </div>
      {isVideoEnabled && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-64 h-48 fixed bottom-4 right-4 bg-black"
        />
      )}
    </div>
  );
};

export default SalaChat;