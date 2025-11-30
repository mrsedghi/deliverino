# Fixes Applied

## Issues Fixed

### 1. Prisma Client Initialization Error
**Error**: `Cannot read properties of undefined (reading '__internal')`

**Fix Applied**:
- Updated `src/lib/prisma.js` to properly initialize PrismaClient
- Added error handling in `src/pages/api/orders/available-modes.js` to gracefully fallback to defaults if Prisma is not available
- Added `getDefaultSettings()` function for fallback

**Action Required**:
```bash
npx prisma generate
```

This must be run after any schema changes to regenerate the Prisma Client.

### 2. Metadata Warnings
**Warning**: `Unsupported metadata themeColor/viewport is configured in metadata export`

**Fix Applied**:
- Moved `themeColor` and `viewport` from `metadata` export to separate `viewport` export in `src/app/layout.js`
- This follows Next.js 16 requirements

### 3. Missing Icon Files (404 errors)
**Status**: Expected - Icons need to be generated

**Solution**:
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 source image
3. Download generated icons
4. Place in `public/` directory:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

### 4. OSRM Request Failed
**Status**: Expected if OSRM server is not running

**Solution**: The app automatically falls back to Haversine distance calculation. This is working as designed.

## Next Steps

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Ensure DATABASE_URL is set** in `.env`:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   ```

3. **Create database and run migrations**:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev --name init
   ```

4. **Generate PWA icons** (optional but recommended):
   - Use online tool or create manually
   - Place in `public/` directory

## Testing

After applying fixes, test:
1. API endpoints should work with fallback settings if DB not connected
2. No more metadata warnings in console
3. Prisma errors should be handled gracefully

