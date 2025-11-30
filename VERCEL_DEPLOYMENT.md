# Vercel Deployment Guide

This guide will help you deploy the Deliverino application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A PostgreSQL database (recommended: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com), or [Neon](https://neon.tech))
3. GitHub/GitLab/Bitbucket account (for automatic deployments)

## Step 1: Prepare Your Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the connection string (it will be automatically added as `DATABASE_URL`)

### Option B: External Database

Use any PostgreSQL provider and get your connection string:
- Format: `postgresql://user:password@host:port/database?sslmode=require`

## Step 2: Deploy to Vercel

### Method 1: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production:
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel will auto-detect Next.js configuration

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MAP_TILE_URL` | OpenStreetMap tile URL | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `NEXT_PUBLIC_OSRM_BASE_URL` | OSRM routing service URL | `http://localhost:5000` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | Auto-detected from Vercel URL |
| `NODE_ENV` | Environment mode | `production` |

### Setting Environment Variables

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for:
   - **Production**
   - **Preview** (optional)
   - **Development** (optional)

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations:

### Option A: Using Vercel CLI

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Option B: Using Vercel Postgres

If using Vercel Postgres, migrations run automatically during build.

### Option C: Manual Migration

1. Connect to your database
2. Run:
   ```bash
   DATABASE_URL="your-connection-string" npx prisma migrate deploy
   ```

## Step 5: Generate Prisma Client

Prisma Client is automatically generated during the build process (configured in `vercel.json`).

If you need to generate it manually:

```bash
npx prisma generate
```

## Step 6: Verify Deployment

1. Check your deployment URL (e.g., `https://your-project.vercel.app`)
2. Test the application:
   - Login/Registration
   - Create an order
   - Test courier dashboard
   - Test admin panel

## Troubleshooting

### Build Errors

**Error: Prisma Client not initialized**
```bash
# Solution: Ensure DATABASE_URL is set and run:
npx prisma generate
```

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure SSL is enabled (`?sslmode=require`)

### Runtime Errors

**Socket.io not working**
- Set `NEXT_PUBLIC_SOCKET_URL` to your Vercel deployment URL
- Ensure WebSocket connections are enabled

**OTP not working**
- Check that environment variables are set correctly
- Verify database connection

### Performance

- Use Vercel's Edge Functions for API routes if needed
- Enable caching for static assets
- Consider using Vercel's Image Optimization

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Prisma Client generated
- [ ] Application accessible at deployment URL
- [ ] Login/Registration working
- [ ] Order creation working
- [ ] Socket.io real-time updates working
- [ ] Admin dashboard accessible
- [ ] PWA manifest and icons configured

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

## Monitoring

- View logs in Vercel dashboard under **Deployments** → **Functions**
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor database performance

## Support

For issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Next.js Documentation](https://nextjs.org/docs)
- Check [Prisma Documentation](https://www.prisma.io/docs)

