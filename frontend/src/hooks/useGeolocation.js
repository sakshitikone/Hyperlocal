// src/hooks/useGeolocation.js — Browser geolocation hook
import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({ lat: null, lng: null, error: null, loading: true });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: null, lng: null, error: 'Geolocation not supported', loading: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({
        lat:     pos.coords.latitude,
        lng:     pos.coords.longitude,
        error:   null,
        loading: false,
      }),
      (err) => {
        // Fallback to a default location (Mumbai) if denied
        setLocation({ lat: 19.076, lng: 72.8777, error: err.message, loading: false });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return location;
};

export default useGeolocation;
