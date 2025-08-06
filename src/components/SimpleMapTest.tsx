import React, { useEffect, useRef, useState } from 'react';

const SimpleMapTest = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setStatus('❌ No API key');
      setError('API key not configured');
      return;
    }

    setStatus('🔄 Loading Google Maps...');

    // Function to initialize map
    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps) {
        setStatus('❌ Google Maps not ready');
        setError('Google Maps API not loaded');
        return;
      }

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 41.7151, lng: 44.8271 }, // Tbilisi
          zoom: 10,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        });

        // Add a simple marker
        new window.google.maps.Marker({
          position: { lat: 41.7151, lng: 44.8271 },
          map: map,
          title: 'Tbilisi'
        });

        setStatus('✅ Map loaded successfully');
        setError(null);
      } catch (err) {
        setStatus('❌ Map initialization failed');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setStatus('🔄 Google Maps loaded, initializing map...');
        setTimeout(initMap, 100); // Small delay to ensure everything is ready
      };
      
      script.onerror = () => {
        setStatus('❌ Failed to load Google Maps');
        setError('Script loading failed');
      };

      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold mb-2">Simple Map Test</h3>
      <div className="space-y-2 text-sm">
        <div>Status: {status}</div>
        {error && (
          <div className="text-red-600 font-medium">Error: {error}</div>
        )}
        <div 
          ref={mapRef} 
          className="w-64 h-48 border rounded bg-gray-100"
        >
          {status.includes('❌') && (
            <div className="flex items-center justify-center h-full text-gray-500">
              Map not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleMapTest; 