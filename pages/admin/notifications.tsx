import { useState, useEffect } from "react";
import { io } from "socket.io-client";

let socket;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // Initialize socket connection
    socket = io();

    // Listen for incoming messages
    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for user status updates (online/offline)
    socket.on("userStatus", (status) => {
      setUserStatus(status);
    });

    // Listen for online users
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Listen for new notifications
    socket.on("newNotification", (notificationMsg) => {
      setNotification(notificationMsg);
      // Hide notification after 5 seconds
      setTimeout(() => setNotification(""), 5000);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle sending message
  const sendMessage = () => {
    if (messageInput.trim()) {
      socket.emit("sendMessage", messageInput); // Emit message to server
      setMessageInput("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col space-y-4">
        {/* Online/Offline status display */}
        <div className="flex justify-between items-center p-2 border-b">
          <h2 className="text-lg font-semibold">Users</h2>
          <div className="flex space-x-4">
            {onlineUsers.map((user, index) => (
              <div
                key={index}
                className={`p-2 rounded-md text-white ${
                  userStatus[user] === "online" ? "bg-green-500" : "bg-gray-500"
                }`}
              >
                {user} ({userStatus[user]})
              </div>
            ))}
          </div>
        </div>

        {/* Messages display */}
        <div className="overflow-y-scroll max-h-96 border p-2">
          {messages.map((msg, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded-md mb-2">
              <p>{msg}</p>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="flex">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-grow p-2 border rounded-md"
            placeholder="Type a message"
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Send
          </button>
        </div>

        {/* Notification banner */}
        {notification && (
          <div className="fixed top-0 left-0 w-full bg-yellow-500 text-white p-4 text-center">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}
