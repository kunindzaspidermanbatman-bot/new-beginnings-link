import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, ExternalLink } from 'lucide-react';

interface MapboxTokenSetupProps {
  onTokenSaved: (token: string) => void;
}

const MapboxTokenSetup = ({ onTokenSaved }: MapboxTokenSetupProps) => {
  const [token, setToken] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateAndSaveToken = async () => {
    if (!token.startsWith('pk.')) {
      setIsValid(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Test the token by making a simple request
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${token}`
      );
      
      if (response.ok) {
        setIsValid(true);
        localStorage.setItem('mapbox_token', token);
        onTokenSaved(token);
      } else {
        setIsValid(false);
      }
    } catch (error) {
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set up Mapbox Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              To enable the interactive map like Airbnb, you need a Mapbox public token. This is free for up to 100,000 map loads per month.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <div className="space-y-2">
              <Input
                id="mapbox-token"
                placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXh..."
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setIsValid(null);
                }}
                className={isValid === false ? "border-red-500" : ""}
              />
              <p className="text-sm text-muted-foreground">
                Your token should start with "pk." and can be found in your{' '}
                <a 
                  href="https://account.mapbox.com/access-tokens/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Mapbox dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>

          {isValid === false && (
            <Alert className="border-red-500">
              <AlertDescription className="text-red-700">
                Invalid token. Please check your Mapbox public token and try again.
              </AlertDescription>
            </Alert>
          )}

          {isValid === true && (
            <Alert className="border-green-500">
              <AlertDescription className="text-green-700">
                ✅ Token validated successfully! Your map is ready to use.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={validateAndSaveToken}
            disabled={!token || isLoading}
            className="w-full"
          >
            {isLoading ? "Validating..." : "Save Token & Enable Map"}
          </Button>

          <div className="text-sm space-y-2 text-muted-foreground">
            <p><strong>How to get your token:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Visit <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a> and sign up/login</li>
              <li>Go to your Account → Access tokens</li>
              <li>Copy your "Default public token" (starts with pk.)</li>
              <li>Paste it above and click "Save Token"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapboxTokenSetup;