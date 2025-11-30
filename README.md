# Deliverino - Delivery Service Platform

A full-stack delivery service application built with Next.js, featuring real-time order tracking, courier management, and admin dashboard.

## Features

- 🚚 Real-time order tracking with Socket.io
- 📱 Progressive Web App (PWA) support
- 🗺️ Interactive map with OpenStreetMap
- 👤 OTP-based authentication
- 💳 Payment processing (Cash/Card)
- 📊 Admin dashboard with statistics
- 🎨 Material-UI with dark mode support

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- (Optional) OSRM routing service

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd deliverino
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Vercel (Recommended)

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:
1. Push your code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

## Environment Variables

See `.env.example` for all required environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

**Optional:**
- `NEXT_PUBLIC_MAP_TILE_URL` - Map tile service URL
- `NEXT_PUBLIC_OSRM_BASE_URL` - Routing service URL
- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL

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
