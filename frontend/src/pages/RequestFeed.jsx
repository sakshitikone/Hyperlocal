// src/pages/RequestFeed.jsx — Filterable list of nearby requests
import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import useGeolocation from '../hooks/useGeolocation';
import RequestCard from '../components/RequestCard';
import { CATEGORIES } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const RADII = [{ label: '1 km', value: 1000 }, { label: '5 km', value: 5000 }, { label: '10 km', value: 10000 }, { label: 'Any', value: 50000 }];

const RequestFeed = () => {
  const { lat, lng }   = useGeolocation();
  const { user }       = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ urgency: 'all', category: 'all', radius: 5000, status: 'open' });
  const [search, setSearch]     = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat:      lat || 19.076,
        lng:      lng || 72.8777,
        radius:   filters.radius,
        status:   filters.status,
      });
      if (filters.urgency !== 'all') params.append('urgency', filters.urgency);
      if (filters.category !== 'all') params.append('category', filters.category);
      const { data } = await api.get(`/requests?${params}`);
      setRequests(data.requests);
    } catch (e) {
      toast.error('Could not load requests');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Listen for new requests via HTTP polling could go here
  useEffect(() => {
    // In a production serverless app, you might poll `/api/requests` here
  }, []);

  const handleRespond = async (id) => {
    try {
      await api.post(`/requests/${id}/respond`);
      toast.success('Response recorded!');
      setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status: 'in-progress' } : r));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const filtered = requests.filter((r) =>
    search === '' || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Request Feed</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--clr-subtext)' }}>
              {filtered.length} requests nearby
            </p>
          </div>
          <button className="btn-ghost text-sm" onClick={fetchRequests}>↻ Refresh</button>
        </div>
      </div>

      {/* Search */}
      <input
        className="input mb-5"
        placeholder="🔍  Search requests..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Urgency */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--clr-border)' }}>
          {['all', 'normal', 'urgent'].map((u) => (
            <button key={u}
              onClick={() => setFilters((f) => ({ ...f, urgency: u }))}
              className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={{
                background: filters.urgency === u ? 'rgba(34,197,94,0.12)' : 'var(--clr-surface)',
                color:      filters.urgency === u ? 'var(--clr-accent2)' : 'var(--clr-subtext)',
              }}>
              {u === 'all' ? 'All urgency' : u}
            </button>
          ))}
        </div>

        {/* Category */}
        <select
          className="input w-auto text-xs py-1.5"
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Radius */}
        <select
          className="input w-auto text-xs py-1.5"
          value={filters.radius}
          onChange={(e) => setFilters((f) => ({ ...f, radius: parseInt(e.target.value) }))}>
          {RADII.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
        </select>

        {/* Status */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--clr-border)' }}>
          {['open', 'in-progress', 'fulfilled'].map((s) => (
            <button key={s}
              onClick={() => setFilters((f) => ({ ...f, status: s }))}
              className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={{
                background: filters.status === s ? 'rgba(34,197,94,0.12)' : 'var(--clr-surface)',
                color:      filters.status === s ? 'var(--clr-accent2)' : 'var(--clr-subtext)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <span className="text-5xl mb-3">📭</span>
          <p className="font-medium">No requests found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <div key={r._id} style={{ animationDelay: `${i * 40}ms` }}>
              <RequestCard request={r} currentUserLat={lat} currentUserLng={lng} onRespond={handleRespond} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestFeed;
