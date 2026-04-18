// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getInitials } from '../utils/helpers';

const NAV = [
  { to: '/dashboard',      icon: '⚡', label: 'Dashboard'     },
  { to: '/feed',           icon: '📡', label: 'Request Feed'  },
  { to: '/create-request', icon: '＋', label: 'New Request'   },
  { to: '/chat',           icon: '💬', label: 'Messages'      },
  { to: '/profile',        icon: '👤', label: 'Profile'       },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount }  = useNotifications();
  const navigate = useNavigate();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const { notifications, markAllRead }      = useNotifications();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--clr-border)' }}>
        <span className="font-display text-xl font-bold" style={{ color: 'var(--clr-accent2)' }}>
          Hyper<span style={{ color: 'var(--clr-text)' }}>Local</span>
        </span>
        <p className="text-xs mt-0.5" style={{ color: 'var(--clr-muted)' }}>Community Exchange</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
            {label === 'Messages' && unreadCount > 0 && (
              <span className="ml-auto rounded-full px-1.5 py-0.5 text-xs font-bold"
                style={{ background: 'var(--clr-accent)', color: '#0a0f0d' }}>
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Notification Bell */}
      <div className="px-2 mb-2 relative">
        <button
          onClick={() => { setShowNotifPanel((p) => !p); markAllRead(); }}
          className="nav-link w-full text-left relative"
        >
          <span>🔔</span>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-auto rounded-full px-1.5 py-0.5 text-xs font-bold"
              style={{ background: 'var(--clr-urgent)', color: '#fff' }}>
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifPanel && (
          <div className="absolute bottom-12 left-2 right-2 z-50 card max-h-72 overflow-y-auto animate-slide-up">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--clr-subtext)' }}>RECENT</p>
            {notifications.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n.id} className="text-xs py-2 border-b" style={{ borderColor: 'var(--clr-border)', color: 'var(--clr-subtext)' }}>
                  {n.message}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--clr-border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--clr-accent2)' }}>
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--clr-text)' }}>{user?.name}</p>
            <div className="flex items-center gap-1">
              <span className="online-dot" />
              <span className="text-xs" style={{ color: 'var(--clr-muted)' }}>Online</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full text-xs">
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
