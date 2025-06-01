'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Connect to WebSocket server
    socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('Connected to socket server:', socket.id);
    });

    // Handle user list updates
    socket.on('users-list', (users) => {
      setUsersList(users.filter((user) => user.userId !== userId));
    });

    // Handle received messages
    socket.on('receive-message', ({ message, from, fromName, timestamp }) => {
      setMessages((prev) => [...prev, { from, fromName, message, timestamp }]);
    });

    // Handle errors
    socket.on('error', (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const registerUser = () => {
    if (userId.trim()) {
      socket.emit('register', userId);
    } else {
      setError('Please enter a valid User ID');
    }
  };

  const sendMessage = () => {
    if (message.trim() && recipientId.trim()) {
      socket.emit('send-message', { message, to: recipientId });
      setMessage('');
    } else {
      setError('Please enter a message and select a recipient');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">الدردشة</h1>
      
      {/* User ID input and registration */}
      <div className="mb-4 flex">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 flex-1 mr-2"
          placeholder="أدخل معرفك (مثل user1، user2)"
        />
        <button
          onClick={registerUser}
          className="bg-green-500 text-white p-2"
        >
          تسجيل
        </button>
      </div>

      {/* Recipient selection */}
      <div className="mb-4">
        <select
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="border p-2 w-full"
          disabled={!userId}
        >
          <option value="">اختر المستلم</option>
          {usersList.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.name} ({user.userId})
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Messages display */}
      <div className="border p-4 h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <span className="font-bold">{msg.fromName} ({msg.from}):</span> {msg.message}
            <span className="text-gray-500 text-sm ml-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 flex-1"
          placeholder="اكتب رسالتك..."
          disabled={!userId || !recipientId}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 ml-2"
          disabled={!userId || !recipientId}
        >
          إرسال
        </button>
      </div>
    </div>
  );
}