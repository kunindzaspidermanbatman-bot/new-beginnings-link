// Global Google Maps loader utility
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadingPromise: Promise<void> | null = null;
  private isLoaded = false;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!(window.google && window.google.maps);
  }

  async loadGoogleMaps(apiKey?: string): Promise<boolean> {
    // If already loaded, return true
    if (this.isGoogleMapsLoaded()) {
      return true;
    }

    // If already loading, wait for the existing promise
    if (this.loadingPromise) {
      try {
        await this.loadingPromise;
        return this.isGoogleMapsLoaded();
      } catch (error) {
        console.error('Google Maps loading failed:', error);
        return false;
      }
    }

    // Get API key from parameter or fetch from Supabase
    let key = apiKey;
    
    if (!key) {
      try {
        console.log('Fetching Google Maps API key from Supabase...');
        const response = await fetch('https://vpyrrctzuudgokhkucli.supabase.co/functions/v1/get-google-maps-api-key');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        key = data.apiKey;
        console.log('Successfully fetched Google Maps API key from Supabase');
      } catch (error) {
        console.error('Failed to fetch Google Maps API key:', error);
        return false;
      }
    }
    
    if (!key || key === 'your-google-maps-api-key-here') {
      console.error('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
      return false;
    }

    this.apiKey = key;

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for it to load...');
      this.loadingPromise = this.waitForExistingScript();
    } else {
      console.log('Loading Google Maps script...');
      this.loadingPromise = this.loadScript();
    }

    try {
      await this.loadingPromise;
      this.isLoaded = true;
      this.loadingPromise = null;
      return true;
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      this.loadingPromise = null;
      return false;
    }
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });
  }

  private waitForExistingScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          console.log('Google Maps loaded from existing script');
          resolve();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };

      // Set a timeout to prevent infinite waiting
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for Google Maps to load'));
      }, 10000);

      checkGoogleMaps();

      // Clear timeout when resolved
      const originalResolve = resolve;
      resolve = () => {
        clearTimeout(timeout);
        originalResolve();
      };
    });
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance();