# PWA Icons

This directory should contain the following PWA icons:

- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

## How to Generate Icons

### Option 1: Online Tools

1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 source image
3. Download the generated icons
4. Place them in the `public/` directory

### Option 2: Using ImageMagick (if installed)

```bash
# Create a 512x512 source image first, then:
for size in 72 96 128 144 152 192 384 512; do
  convert icon.jpg -resize ${size}x${size} public/icon-${size}x${size}.png
done
```

### Option 3: Manual Creation

Create icons using any image editor (Photoshop, GIMP, etc.) with the sizes listed above.

## Icon Requirements

- Format: PNG
- Square aspect ratio (1:1)
- Transparent background recommended
- Should work well on both light and dark backgrounds
- For maskable icons, ensure important content is within the safe zone (80% of the icon)

## Temporary Solution

For development/testing, you can create simple colored squares as placeholders:

- Use a solid color (e.g., #3b82f6) with the app name or logo
- Ensure all icons are the correct dimensions
