# App Icons Directory

This directory should contain the following PNG icons for the PWA:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons:

### Option 1: Using PWA Asset Generator
```bash
npx pwa-asset-generator logo.svg ./icons --icon-only --favicon
```

### Option 2: Using Online Tools
- Visit https://realfavicongenerator.net/
- Upload your logo
- Download generated icons

### Option 3: Manual Creation
Create a simple medical cross icon in any image editor and export in different sizes.

## Recommended Icon Design:
- Medical cross or stethoscope symbol
- Colors: Blue (#2563eb) and white
- Simple, recognizable design
- Works well at small sizes

For now, the app will work without icons, but they are recommended for a complete PWA experience.
