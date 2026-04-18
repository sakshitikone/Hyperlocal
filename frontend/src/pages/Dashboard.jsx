// src/pages/Dashboard.jsx — Stats overview + recent requests
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import useGeolocation from '../hooks/useGeolocation';
import RequestCard from '../components/RequestCard';
import { getInitials, starArray, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: `${color}18` }}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-display font-bold" style={{ color: 'var(--clr-text)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--clr-subtext)' }}>{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user }             = useAuth();
  const { lat, lng }         = useGeolocation();
  const navigate             = useNavigate();
  const [recentReqs, setRecentReqs]   = useState([]);
  const [myReqs, setMyReqs]           = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [feedRes, myRes] = await Promise.all([
          api.get(`/requests?lat=${lat || 19.076}&lng=${lng || 72.8777}&radius=5000`),
          api.get('/requests/my'),
        ]);
        setRecentReqs(feedRes.data.requests.slice(0, 4));
        setMyReqs(myRes.data.requests.slice(0, 3));

        if (lat && lng) {
          const nearRes = await api.get(`/users/nearby?lat=${lat}&lng=${lng}`);
          setNearbyUsers(nearRes.data.users.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [lat, lng]);

  const handleRespond = async (id) => {
    try {
      await api.post(`/requests/${id}/respond`);
      toast.success('You offered to help!');
      setRecentReqs((prev) => prev.map((r) => r._id === id ? { ...r, status: 'in-progress' } : r));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const openCount   = recentReqs.filter((r) => r.status === 'open').length;
  const urgentCount = recentReqs.filter((r) => r.urgency === 'urgent').length;

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--clr-subtext)' }}>Here's what's happening nearby</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/create-request')}>
          + New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📡" label="Nearby Requests" value={recentReqs.length} color="#22c55e" />
        <StatCard icon="🔴" label="Urgent"           value={urgentCount}       color="#f97316" />
        <StatCard icon="👥" label="Nearby Users"     value={nearbyUsers.length} color="#a78bfa" />
        <StatCard icon="📋" label="My Requests"      value={myReqs.length}     color="#38bdf8" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--clr-text)' }}>Nearby Requests</h2>
            <button className="text-xs btn-ghost" onClick={() => navigate('/feed')}>View all →</button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner w-8 h-8" /></div>
          ) : recentReqs.length === 0 ? (
            <div className="empty-state card">
              <span className="text-4xl mb-3">📭</span>
              <p>No requests nearby yet</p>
              <button className="btn-primary mt-4 text-sm" onClick={() => navigate('/create-request')}>
                Post the first one!
              </button>
            </div>
          ) : (
            recentReqs.map((r) => (
              <RequestCard key={r._id} request={r} currentUserLat={lat} currentUserLng={lng} onRespond={handleRespond} />
            ))
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* My profile snapshot */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--clr-accent2)' }}>
                {getInitials(user?.name)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--clr-text)' }}>{user?.name}</p>
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--clr-subtext)' }}>
                  <span>{starArray(user?.rating?.average || 0).join('')}</span>
                  <span>({user?.rating?.count || 0} ratings)</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--clr-surface)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--clr-accent2)' }}>{myReqs.length}</p>
                <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>My Posts</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--clr-surface)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--clr-accent2)' }}>
                  {user?.rating?.average ? user.rating.average.toFixed(1) : '—'}
                </p>
                <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>Rating</p>
              </div>
            </div>
          </div>

          {/* Nearby users */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--clr-subtext)' }}>NEARBY COMMUNITY</h3>
            {nearbyUsers.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>No users nearby detected</p>
            ) : (
              <div className="space-y-3">
                {nearbyUsers.map((u) => (
                  <div key={u._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                      style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
                      {getInitials(u.name)}
                      <span className={`absolute -bottom-0.5 -right-0.5 ${u.isOnline ? 'online-dot' : 'offline-dot'}`}
                        style={{ width: 8, height: 8 }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--clr-text)' }}>{u.name}</p>
                      <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>
                        {u.isOnline ? 'Online now' : `Last seen ${timeAgo(u.lastSeen)}`}
                      </p>
                    </div>
                    <button className="btn-ghost text-xs px-2 py-1 ml-auto flex-shrink-0"
                      onClick={() => navigate(`/chat?userId=${u._id}`)}>
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My recent requests */}
          {myReqs.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--clr-subtext)' }}>MY RECENT POSTS</h3>
              <div className="space-y-2">
                {myReqs.map((r) => (
                  <div key={r._id} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--clr-border)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--clr-text)' }}>{r.title}</p>
                      <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>{timeAgo(r.createdAt)}</p>
                    </div>
                    <span className={r.status === 'open' ? 'badge-normal' : 'badge'} style={
                      r.status !== 'open' ? { background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' } : {}
                    }>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
