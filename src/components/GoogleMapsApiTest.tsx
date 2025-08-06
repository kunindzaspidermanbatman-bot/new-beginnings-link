import React, { useEffect, useState } from 'react';

const GoogleMapsApiTest = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);
  const [apiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const [scriptStatus, setScriptStatus] = useState<string>('Checking...');

  useEffect(() => {
    const testApiKey = async () => {
      if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
        setTestResult('❌ No API key configured');
        setError('Add VITE_GOOGLE_MAPS_API_KEY to your .env file');
        return;
      }

      try {
        // Test the API key by making a request to the Maps JavaScript API
        const response = await fetch(`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`);
        
        if (response.ok) {
          setTestResult('✅ API key is valid');
          setError(null);
        } else if (response.status === 403) {
          setTestResult('❌ API key is invalid or restricted');
          setError('Check your API key and make sure the required APIs are enabled');
        } else if (response.status === 404) {
          setTestResult('❌ API key not found');
          setError('The API key does not exist or is not properly configured');
        } else {
          setTestResult(`❌ Error: ${response.status}`);
          setError(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        setTestResult('❌ Network error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    const checkScriptLoading = () => {
      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        setScriptStatus('✅ Script tag found in DOM');
      } else {
        setScriptStatus('❌ No script tag found');
      }

      // Check if Google object is available
      if (window.google) {
        setScriptStatus('✅ Google object available');
        if (window.google.maps) {
          setScriptStatus('✅ Google Maps available');
        } else {
          setScriptStatus('⚠️ Google object exists but Maps not loaded');
        }
      } else {
        setScriptStatus('❌ Google object not available');
      }
    };

    testApiKey();
    checkScriptLoading();

    // Check again after a delay
    const timer = setTimeout(checkScriptLoading, 3000);

    return () => clearTimeout(timer);
  }, [apiKey]);

  const manuallyLoadScript = () => {
    if (!apiKey) return;

    console.log('Manually loading Google Maps script...');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded manually');
      setScriptStatus('✅ Script loaded manually');
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script manually');
      setScriptStatus('❌ Manual script load failed');
    };

    document.head.appendChild(script);
  };

  return (
    <div className="fixed top-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold mb-2">Google Maps API Test</h3>
      <div className="space-y-2 text-sm">
        <div>API Status: {testResult}</div>
        <div>Script Status: {scriptStatus}</div>
        <div>API Key: {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found'}</div>
        {error && (
          <div className="text-red-600 font-medium">Error: {error}</div>
        )}
        
        <button 
          onClick={manuallyLoadScript}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Manually Load Script
        </button>
        
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
          <p className="font-medium mb-1">To fix:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to Google Cloud Console</li>
            <li>Enable Maps JavaScript API</li>
            <li>Enable Places API</li>
            <li>Enable billing</li>
            <li>Check API key restrictions</li>
            <li>Try manually loading script</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsApiTest; 