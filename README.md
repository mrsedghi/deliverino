This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Environment Variables

This project requires several environment variables to be configured. Copy `.env.example` to `.env` and fill in the required values:

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string in the format: `postgresql://USER:PASSWORD@HOST:PORT/DB`
  - Example: `postgresql://postgres:password@localhost:5432/deliverino`

### Map Configuration
- `NEXT_PUBLIC_MAP_TILE_URL` - OpenStreetMap tile server URL template
  - Default: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  - The `{s}`, `{z}`, `{x}`, `{y}` placeholders are replaced by Leaflet automatically

### Routing Service Configuration
- `NEXT_PUBLIC_OSRM_BASE_URL` - Base URL for routing service (OSRM, GraphHopper, or Valhalla)
  - Default: `http://localhost:5000` (for local OSRM instance)
  - For production, use your deployed routing service URL

### Firebase Cloud Messaging (FCM) Configuration
- `NEXT_PUBLIC_FCM_SENDER_ID` - Firebase Cloud Messaging sender ID for push notifications
  - Obtain this from your Firebase project settings

### SMS Provider Configuration
- `SMS_PROVIDER_API_KEY` - API key for SMS service provider
  - Used for sending delivery notifications via SMS

### Authentication Configuration
- `JWT_SECRET` - Secret key for JWT token signing and verification
  - **Important**: Use a strong, random secret in production
  - Generate with: `openssl rand -base64 32`

### Setup Instructions
1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Never commit `.env` to version control (it's already in `.gitignore`)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
