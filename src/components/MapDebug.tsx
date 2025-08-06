import React, { useEffect, useState } from 'react';

const MapDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    googleLoaded: false,
    googleMaps: false,
    error: null as string | null
  });

  useEffect(() => {
    const checkGoogleMaps = () => {
      const newDebugInfo = {
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        googleLoaded: !!window.google,
        googleMaps: !!(window.google && window.google.maps),
        error: null
      };

      if (!newDebugInfo.apiKey || newDebugInfo.apiKey === 'your-google-maps-api-key-here') {
        newDebugInfo.error = 'API key not configured';
      } else if (!newDebugInfo.googleLoaded) {
        newDebugInfo.error = 'Google object not loaded';
      } else if (!newDebugInfo.googleMaps) {
        newDebugInfo.error = 'Google Maps not loaded';
      }

      setDebugInfo(newDebugInfo);
    };

    // Check immediately
    checkGoogleMaps();

    // Check again after a delay
    const timer = setTimeout(checkGoogleMaps, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold mb-2">Map Debug Info</h3>
      <div className="space-y-1 text-sm">
        <div>API Key: {debugInfo.apiKey ? '✅ Set' : '❌ Missing'}</div>
        <div>Google Object: {debugInfo.googleLoaded ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div>Google Maps: {debugInfo.googleMaps ? '✅ Available' : '❌ Not available'}</div>
        {debugInfo.error && (
          <div className="text-red-600 font-medium">Error: {debugInfo.error}</div>
        )}
        {debugInfo.apiKey && (
          <div className="text-xs text-gray-500 mt-2">
            Key: {debugInfo.apiKey.substring(0, 10)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDebug; 