// src/components/RequestCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo, CATEGORY_ICONS, getInitials, starArray } from '../utils/helpers';

const RequestCard = ({ request, currentUserLat, currentUserLng, onRespond }) => {
  const navigate = useNavigate();
  const { title, description, category, urgency, status, user, location, createdAt } = request;

  const lat = location?.coordinates?.[1];
  const lng = location?.coordinates?.[0];

  let distLabel = null;
  if (currentUserLat && currentUserLng && lat && lng) {
    const R = 6371;
    const dLat = ((lat - currentUserLat) * Math.PI) / 180;
    const dLng = ((lng - currentUserLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((currentUserLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const d = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
    distLabel = `${d} km`;
  }

  return (
    <div className="card-hover animate-slide-up cursor-pointer" onClick={() => navigate(`/requests/${request._id}`)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--clr-text)' }}>{user?.name}</p>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--clr-muted)' }}>
              <span>{starArray(user?.rating?.average).join('')}</span>
              <span>({user?.rating?.count || 0})</span>
              {user?.isVerified && <span title="Verified">✔️</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={urgency === 'urgent' ? 'badge-urgent' : 'badge-normal'}>
            {urgency === 'urgent' ? '🔴 Urgent' : '🟢 Normal'}
          </span>
          {distLabel && (
            <span className="text-xs" style={{ color: 'var(--clr-muted)' }}>📍 {distLabel}</span>
          )}
        </div>
      </div>

      {/* Title & description */}
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--clr-text)' }}>{title}</h3>
      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--clr-subtext)' }}>{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge-category">
            {CATEGORY_ICONS[category]} {category}
          </span>
          <span className="text-xs" style={{ color: 'var(--clr-muted)' }}>{timeAgo(createdAt)}</span>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-ghost text-xs px-3 py-1.5"
            onClick={() => navigate(`/chat?userId=${user?._id}&requestId=${request._id}`)}
          >
            💬 Chat
          </button>
          {status === 'open' && onRespond && (
            <button className="btn-primary text-xs px-3 py-1.5" onClick={() => onRespond(request._id)}>
              Help
            </button>
          )}
          {status === 'in-progress' && (
            <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
              In Progress
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
