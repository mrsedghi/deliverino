# PWA Setup Instructions

This project is configured as a Progressive Web App (PWA) using `next-pwa`.

## Features

- ✅ Service Worker for offline support
- ✅ Web App Manifest for installability
- ✅ Offline fallback page
- ✅ Smart caching strategy (excludes map tiles from aggressive caching)
- ✅ Installable on mobile and desktop

## Setup

### 1. Generate PWA Icons

Before the app can be installed, you need to create PWA icons. Place the following icon files in the `public/` directory:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

**Quick Setup:**

1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 source image
3. Download the generated icons
4. Place them in the `public/` directory

### 2. Build and Test

```bash
# Build the production version
npm run build

# Start the production server
npm start
```

### 3. Test Installability

1. Open Chrome DevTools
2. Go to the "Lighthouse" tab
3. Select "Progressive Web App" category
4. Click "Generate report"
5. Check for installability criteria

Or test manually:

- **Chrome/Edge**: Look for the install icon in the address bar
- **Mobile**: Use "Add to Home Screen" option
- **iOS Safari**: Use "Add to Home Screen" from the share menu

## Configuration

### Service Worker

The service worker is configured in `next.config.mjs` with the following caching strategies:

- **Map Tiles**: NetworkFirst (limited cache, 24h expiration, max 50 entries)
- **API Calls**: NetworkFirst (5min cache)
- **Static Assets**: CacheFirst (long-term cache)
- **Images**: CacheFirst (30 days)

### Offline Support

- Offline fallback page: `/offline.html`
- Automatically shown when the app is offline and a page isn't cached

### Development Mode

PWA is **disabled in development mode** by default. To test PWA features:

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Test in a production-like environment

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet

## Troubleshooting

### Service Worker Not Registering

1. Clear browser cache and service workers
2. Check browser console for errors
3. Ensure you're using HTTPS (or localhost for development)

### Icons Not Showing

1. Verify all icon files exist in `public/` directory
2. Check that icon paths in `manifest.json` are correct
3. Clear browser cache

### App Not Installable

1. Run Lighthouse PWA audit
2. Check that all required manifest fields are present
3. Ensure service worker is registered
4. Verify icons are properly sized and accessible

## Next Steps

1. Add actual app icons (replace placeholders)
2. Customize manifest.json with your branding
3. Test offline functionality
4. Add push notifications (optional)
5. Configure background sync (optional)
