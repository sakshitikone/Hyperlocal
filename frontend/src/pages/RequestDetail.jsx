// src/pages/RequestDetail.jsx — Single request view with respond + chat
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_ICONS, timeAgo, getInitials, starArray } from '../utils/helpers';
import toast from 'react-hot-toast';

const StatusPill = ({ status }) => {
  const styles = {
    open:        { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80',  border: 'rgba(34,197,94,0.2)'   },
    'in-progress':{ bg: 'rgba(99,102,241,0.1)', color: '#a5b4fc',  border: 'rgba(99,102,241,0.2)' },
    fulfilled:   { bg: 'rgba(56,189,248,0.1)',  color: '#7dd3fc',  border: 'rgba(56,189,248,0.2)'  },
    closed:      { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8',  border: 'rgba(100,116,139,0.2)' },
  };
  const s = styles[status] || styles.open;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

const RequestDetail = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [req, setReq]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [updating, setUpdating]     = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/requests/${id}`);
        setReq(data.request);
      } catch {
        toast.error('Request not found');
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]); // eslint-disable-line

  const handleRespond = async () => {
    setResponding(true);
    try {
      await api.post(`/requests/${id}/respond`);
      toast.success("You're helping! Start a chat with the requester.");
      setReq((r) => ({ ...r, status: 'in-progress', respondents: [...(r.respondents || []), user] }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    } finally {
      setResponding(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/requests/${id}`, { status: newStatus });
      setReq(data.request);
      toast.success(`Status updated to "${newStatus}"`);
    } catch (e) {
      toast.error('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      toast.success('Request deleted');
      navigate('/feed');
    } catch {
      toast.error('Could not delete');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>;
  }
  if (!req) return null;

  const isOwner       = req.user?._id === user?._id;
  const alreadyHelped = req.respondents?.some((r) => (r._id || r) === user?._id);
  const lat = req.location?.coordinates?.[1];
  const lng = req.location?.coordinates?.[0];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Back */}
      <button className="btn-ghost text-sm mb-6" onClick={() => navigate(-1)}>← Back</button>

      {/* Main card */}
      <div className="card mb-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--clr-text)' }}>{req.title}</h1>
          <StatusPill status={req.status} />
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className={req.urgency === 'urgent' ? 'badge-urgent' : 'badge-normal'}>
            {req.urgency === 'urgent' ? '🔴 Urgent' : '🟢 Normal'}
          </span>
          <span className="badge-category">
            {CATEGORY_ICONS[req.category]} {req.category}
          </span>
          <span className="text-xs" style={{ color: 'var(--clr-muted)' }}>
            🕐 {timeAgo(req.createdAt)}
          </span>
          {req.location?.address && (
            <span className="text-xs" style={{ color: 'var(--clr-muted)' }}>
              📍 {req.location.address}
            </span>
          )}
        </div>

        <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--clr-subtext)' }}>
          {req.description}
        </p>

        {/* Requester */}
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--clr-surface)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--clr-accent2)' }}>
            {getInitials(req.user?.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold" style={{ color: 'var(--clr-text)' }}>{req.user?.name}</p>
              {req.user?.isVerified && <span className="text-xs" title="Verified">✔️</span>}
            </div>
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--clr-subtext)' }}>
              <span>{starArray(req.user?.rating?.average || 0).join('')}</span>
              <span>({req.user?.rating?.count || 0} ratings)</span>
            </div>
          </div>
          {!isOwner && (
            <button
              className="btn-ghost text-sm"
              onClick={() => navigate(`/chat?userId=${req.user?._id}&requestId=${req._id}`)}
            >
              💬 Chat
            </button>
          )}
        </div>
      </div>

      {/* Respondents */}
      {req.respondents?.length > 0 && (
        <div className="card mb-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--clr-subtext)' }}>
            HELPERS ({req.respondents.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {req.respondents.map((r) => (
              <div key={r._id || r} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'var(--clr-surface)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
                  {getInitials(r.name || '?')}
                </div>
                <span className="text-sm" style={{ color: 'var(--clr-text)' }}>{r.name || 'Someone'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {/* Non-owner: respond */}
        {!isOwner && req.status === 'open' && !alreadyHelped && (
          <button className="btn-primary flex-1 py-3" onClick={handleRespond} disabled={responding}>
            {responding ? <span className="spinner w-4 h-4" /> : '🤝 Offer to Help'}
          </button>
        )}
        {alreadyHelped && (
          <div className="flex-1 p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(34,197,94,0.08)', color: 'var(--clr-accent2)', border: '1px solid rgba(34,197,94,0.2)' }}>
            ✅ You're helping with this
          </div>
        )}

        {/* Owner actions */}
        {isOwner && (
          <>
            {req.status !== 'fulfilled' && (
              <button className="btn-ghost flex-1" onClick={() => handleStatusChange('fulfilled')} disabled={updating}>
                ✅ Mark as Fulfilled
              </button>
            )}
            {req.status === 'open' && (
              <button className="btn-ghost" onClick={() => handleStatusChange('closed')} disabled={updating}>
                Close
              </button>
            )}
            <button className="btn-danger" onClick={handleDelete}>🗑 Delete</button>
          </>
        )}

        {lat && lng && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm"
          >
            🗺 View on Map
          </a>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;
