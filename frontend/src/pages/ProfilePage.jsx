// src/pages/ProfilePage.jsx — Edit profile, view rating, see own requests
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials, starArray, timeAgo, CATEGORY_ICONS } from '../utils/helpers';
import useGeolocation from '../hooks/useGeolocation';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { id }               = useParams();           // if viewing another user
  const { user, updateUser } = useAuth();
  const { lat, lng }         = useGeolocation();
  const navigate             = useNavigate();
  const isOwnProfile         = !id || id === user?._id;

  const [profile, setProfile]   = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [rating, setRating]     = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [form, setForm]         = useState({ name: '', bio: '', address: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const targetId = id || user?._id;
        const [profRes, reqRes] = await Promise.all([
          api.get(`/users/${targetId}`),
          isOwnProfile ? api.get('/requests/my') : Promise.resolve({ data: { requests: [] } }),
        ]);
        setProfile(profRes.data.user);
        setRequests(reqRes.data.requests || []);
        setForm({
          name:    profRes.data.user.name || '',
          bio:     profRes.data.user.bio  || '',
          address: profRes.data.user.location?.address || '',
        });
      } catch {
        toast.error('Could not load profile');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]); // eslint-disable-line

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (lat && lng) { payload.lat = lat; payload.lng = lng; }
      const { data } = await api.put('/auth/profile', payload);
      setProfile(data.user);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRate = async (stars) => {
    try {
      await api.post(`/users/${profile._id}/rate`, { rating: stars });
      setRating(stars);
      toast.success(`Rated ${stars} ⭐`);
      const { data } = await api.get(`/users/${profile._id}`);
      setProfile(data.user);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not rate');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>;
  }
  if (!profile) return null;

  const openCount      = requests.filter((r) => r.status === 'open').length;
  const fulfilledCount = requests.filter((r) => r.status === 'fulfilled').length;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Profile hero card */}
      <div className="card mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--clr-accent2)' }}>
            {getInitials(profile.name)}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea className="input resize-none" rows={2} value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    maxLength={200} placeholder="Tell the community about yourself..." />
                </div>
                <div>
                  <label className="label">Address / Location</label>
                  <input className="input" value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="e.g. Building A, University Campus" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner w-4 h-4" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--clr-text)' }}>{profile.name}</h1>
                  {profile.isVerified && (
                    <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.2)' }}>
                      ✔ Verified
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-sm mb-2" style={{ color: 'var(--clr-subtext)' }}>{profile.bio}</p>
                )}
                {profile.location?.address && (
                  <p className="text-xs mb-3" style={{ color: 'var(--clr-muted)' }}>📍 {profile.location.address}</p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ color: '#fbbf24' }}>
                    {starArray(profile.rating?.average || 0).join('')}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--clr-text)' }}>
                    {profile.rating?.average?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--clr-muted)' }}>
                    ({profile.rating?.count || 0} ratings)
                  </span>
                </div>

                <p className="text-xs mt-2" style={{ color: 'var(--clr-muted)' }}>
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </>
            )}
          </div>

          {isOwnProfile && !editing && (
            <button className="btn-ghost text-xs flex-shrink-0" onClick={() => setEditing(true)}>
              ✏ Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Posts', value: requests.length },
          { label: 'Open',        value: openCount       },
          { label: 'Fulfilled',   value: fulfilledCount  },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-display font-bold mb-1" style={{ color: 'var(--clr-accent2)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Rate this user (non-owner only) */}
      {!isOwnProfile && (
        <div className="card mb-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--clr-subtext)' }}>RATE THIS USER</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setRatingHover(star)}
                onMouseLeave={() => setRatingHover(0)}
                onClick={() => handleRate(star)}
                className="text-3xl transition-transform hover:scale-110"
                style={{ color: star <= (ratingHover || rating) ? '#fbbf24' : 'var(--clr-border)' }}
              >
                ★
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm ml-2" style={{ color: 'var(--clr-subtext)' }}>You rated {rating}/5</span>
            )}
          </div>
          <button
            className="btn-ghost text-sm mt-4"
            onClick={() => navigate(`/chat?userId=${profile._id}`)}
          >
            💬 Send Message
          </button>
        </div>
      )}

      {/* Requests list */}
      {isOwnProfile && requests.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--clr-subtext)' }}>MY REQUESTS</h3>
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--clr-border)' }}
                onClick={() => navigate(`/requests/${r._id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{CATEGORY_ICONS[r.category]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--clr-text)' }}>{r.title}</p>
                    <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={r.urgency === 'urgent' ? 'badge-urgent' : 'badge-normal'}>
                    {r.urgency}
                  </span>
                  <span className="badge" style={
                    r.status === 'open'        ? { background: 'rgba(34,197,94,0.1)',  color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                    : r.status === 'in-progress' ? { background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }
                    : { background: 'rgba(56,189,248,0.1)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.2)' }
                  }>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
