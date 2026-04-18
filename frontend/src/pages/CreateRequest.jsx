// src/pages/CreateRequest.jsx — Form to post a new help/resource request
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useGeolocation from '../hooks/useGeolocation';
import { CATEGORIES, CATEGORY_ICONS } from '../utils/helpers';
import toast from 'react-hot-toast';

const CreateRequest = () => {
  const navigate        = useNavigate();
  const { lat, lng }    = useGeolocation();
  const mapRef          = useRef(null);
  const markerRef       = useRef(null);
  const mapInstanceRef  = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    'help',
    urgency:     'normal',
    lat:         '',
    lng:         '',
    address:     '',
  });

  // Set initial coordinates once geolocation resolves
  useEffect(() => {
    if (lat && lng && !form.lat) {
      setForm((f) => ({ ...f, lat: lat.toString(), lng: lng.toString() }));
    }
  }, [lat, lng]); // eslint-disable-line

  // Load Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setMapLoaded(false);
      return;
    }
    if (window.google?.maps) { setMapLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map once loaded + coordinates available
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !form.lat) return;
    if (mapInstanceRef.current) return; // already initialized

    const center = { lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      styles: [
        { elementType: 'geometry',        stylers: [{ color: '#111814' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#7a9982' }] },
        { featureType: 'road',             elementType: 'geometry', stylers: [{ color: '#1f2e27' }] },
        { featureType: 'water',            elementType: 'geometry', stylers: [{ color: '#0a0f0d' }] },
        { featureType: 'poi',              stylers: [{ visibility: 'off' }] },
      ],
    });

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: true,
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#0a0f0d', strokeWeight: 2 },
    });

    marker.addListener('dragend', (e) => {
      const newLat = e.latLng.lat().toFixed(6);
      const newLng = e.latLng.lng().toFixed(6);
      setForm((f) => ({ ...f, lat: newLat, lng: newLng }));
      // Reverse geocode
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: parseFloat(newLat), lng: parseFloat(newLng) } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setForm((f) => ({ ...f, address: results[0].formatted_address }));
        }
      });
    });

    map.addListener('click', (e) => {
      const newLat = e.latLng.lat().toFixed(6);
      const newLng = e.latLng.lng().toFixed(6);
      marker.setPosition(e.latLng);
      setForm((f) => ({ ...f, lat: newLat, lng: newLng }));
    });

    mapInstanceRef.current = map;
    markerRef.current      = marker;
  }, [mapLoaded, form.lat]); // eslint-disable-line

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      toast.error('Please allow location access or enter coordinates');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/requests', form);

      // Serverless Migration: socket emit removed

      toast.success('Request posted!');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const apiKeyMissing = !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here';

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Post a Request</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--clr-subtext)' }}>
          Let your community know what you need
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="label">Request Title *</label>
          <input
            className="input"
            name="title"
            placeholder="e.g. Need a phone charger for 30 mins"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={100}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--clr-muted)' }}>{form.title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description *</label>
          <textarea
            className="input resize-none"
            name="description"
            placeholder="Describe what you need, how long, any specific requirements..."
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
            maxLength={500}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--clr-muted)' }}>{form.description.length}/500</p>
        </div>

        {/* Category + Urgency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium border transition-all"
                  style={{
                    background:   form.category === cat ? 'rgba(34,197,94,0.12)' : 'var(--clr-surface)',
                    borderColor:  form.category === cat ? 'rgba(34,197,94,0.4)' : 'var(--clr-border)',
                    color:        form.category === cat ? 'var(--clr-accent2)' : 'var(--clr-subtext)',
                  }}
                >
                  <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                  <span className="capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Urgency *</label>
            <div className="flex flex-col gap-3">
              {[
                { value: 'normal', icon: '🟢', label: 'Normal',       desc: 'Flexible timing' },
                { value: 'urgent', icon: '🔴', label: 'Urgent',       desc: 'Need ASAP' },
              ].map(({ value, icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, urgency: value }))}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    background:  form.urgency === value ? (value === 'urgent' ? 'rgba(249,115,22,0.1)' : 'rgba(34,197,94,0.1)') : 'var(--clr-surface)',
                    borderColor: form.urgency === value ? (value === 'urgent' ? 'rgba(249,115,22,0.3)' : 'rgba(34,197,94,0.3)') : 'var(--clr-border)',
                  }}
                >
                  <span>{icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--clr-text)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label">Location *</label>

          {apiKeyMissing ? (
            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c' }}>
              ⚠️ Google Maps API key not configured. Using your device GPS coordinates.
              {form.lat && (
                <p className="mt-1 font-mono text-xs" style={{ color: 'var(--clr-subtext)' }}>
                  📍 {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
                </p>
              )}
            </div>
          ) : (
            <div
              ref={mapRef}
              className="w-full rounded-xl overflow-hidden"
              style={{ height: 240, background: 'var(--clr-surface)', border: '1px solid var(--clr-border)' }}
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="spinner w-8 h-8" />
                </div>
              )}
            </div>
          )}

          <div className="mt-2">
            <label className="label">Address (optional)</label>
            <input
              className="input"
              name="address"
              placeholder="Building, street, or landmark"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          {/* Coordinate override */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="label">Latitude</label>
              <input className="input font-mono text-xs" name="lat" placeholder="19.0760" value={form.lat} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input className="input font-mono text-xs" name="lng" placeholder="72.8777" value={form.lng} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 py-3" disabled={loading}>
            {loading ? <><span className="spinner w-4 h-4" /> Posting...</> : '📤 Post Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
