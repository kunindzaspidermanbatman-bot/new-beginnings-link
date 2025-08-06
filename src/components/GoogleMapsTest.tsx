import React, { useEffect, useState } from 'react';

const GoogleMapsTest = () => {
  const [status, setStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if API key is loaded
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    setApiKey(key);
    
    if (!key || key === 'your-google-maps-api-key-here') {
      setStatus('❌ API Key not configured');
      setError('Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
      return;
    }

    setStatus('✅ API Key found');

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setStatus('✅ Google Maps API loaded');
      return;
    }

    // Try to load Google Maps
    setStatus('🔄 Loading Google Maps API...');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setStatus('✅ Google Maps API loaded successfully');
    };
    
    script.onerror = () => {
      setStatus('❌ Failed to load Google Maps API');
      setError('Check your API key and internet connection');
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-md">
      <h3 className="text-lg font-semibold mb-4">Google Maps API Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span>{status}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">API Key:</span>
          <span className="text-sm">
            {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found'}
          </span>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm mt-2">
            Error: {error}
          </div>
        )}
        
        {window.google && window.google.maps && (
          <div className="text-green-600 text-sm mt-2">
            ✅ Google Maps object available in window.google.maps
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <p className="font-medium mb-2">Next steps:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make sure your API key is valid</li>
          <li>Enable Maps JavaScript API in Google Cloud Console</li>
          <li>Enable billing for your Google Cloud project</li>
          <li>Check browser console for any errors</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleMapsTest; 