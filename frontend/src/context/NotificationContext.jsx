// src/context/NotificationContext.jsx — Real-time socket notifications
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    // New request nearby
    socket.on('request:notification', (data) => {
      const notif = {
        id:        Date.now(),
        type:      'request',
        message:   data.message,
        request:   data.request,
        read:      false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);

      // Toast notification
      toast(data.message, {
        icon: data.request?.urgency === 'urgent' ? '🔴' : '📍',
        style: {
          background: '#161e1a',
          color: '#e8f0eb',
          border: '1px solid #1f2e27',
          fontFamily: 'DM Sans, sans-serif',
        },
      });
    });

    // Incoming message notification
    socket.on('message:receive', (msg) => {
      const notif = {
        id:        Date.now(),
        type:      'message',
        message:   `New message from ${msg.sender?.name || 'someone'}`,
        data:      msg,
        read:      false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.off('request:notification');
      socket.off('message:receive');
    };
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
