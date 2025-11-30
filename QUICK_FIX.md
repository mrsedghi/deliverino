# Quick Fix for Prisma 7 Error

## Error
```
Error [PrismaClientConstructorValidationError]: Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

## Solution

Run these commands in order:

```bash
# 1. Clean Prisma generated files
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 2. Regenerate Prisma Client
npx prisma generate

# 3. Restart dev server
pnpm dev
```

## Why This Happens

In Prisma 7, the client generation process creates the necessary configuration. If the client wasn't generated properly or is out of sync, you'll see this error.

## Alternative: Check Prisma Version

If the above doesn't work, ensure Prisma versions match:

```bash
# Check versions
npx prisma --version
npm list @prisma/client prisma

# If versions don't match, reinstall
npm install prisma@latest @prisma/client@latest
npx prisma generate
```

## Note

The app will work with fallback defaults even if Prisma isn't connected, but database operations will fail. Make sure to:
1. Set DATABASE_URL in .env
2. Run `npx prisma generate`
3. Run `npx prisma db push` or `npx prisma migrate dev`

