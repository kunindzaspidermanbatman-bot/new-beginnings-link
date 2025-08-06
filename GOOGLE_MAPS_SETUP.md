# Google Maps Setup Guide

## Prerequisites

1. **Google Cloud Console Account**: You need a Google Cloud account
2. **Google Maps API Key**: You'll need to create an API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API (for geocoding)

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

### 2. Enable Required APIs

1. Go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API**
   - **Places API**

### 3. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 4. Configure Environment Variables

Create a `.env` file in your project root and add:

```env
VITE_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

### 5. Restrict API Key (Recommended)

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers (web sites)"
4. Add your domain(s) to the allowed referrers
5. Under "API restrictions", select "Restrict key"
6. Select only the APIs you need (Maps JavaScript API, Places API)

## Usage

The Google Maps integration is now ready to use! The map will automatically load with your API key and display venues with stable coordinates.

## Features

- ✅ Stable venue coordinates (no jumping)
- ✅ Custom price markers
- ✅ Venue popups
- ✅ Zoom and pan functionality
- ✅ Bounds change detection
- ✅ Responsive design

## Troubleshooting

### "API key not configured" error
- Make sure you've created a `.env` file with `VITE_GOOGLE_MAPS_API_KEY`
- Restart your development server after adding the environment variable

### "Failed to load Google Maps API" error
- Check that your API key is correct
- Verify that Maps JavaScript API is enabled
- Check that billing is enabled for your Google Cloud project

### Venues not showing
- Check the browser console for any JavaScript errors
- Verify that your API key has the correct permissions
- Make sure the venues have valid coordinates or districts 