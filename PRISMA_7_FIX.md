# Prisma 7 Fix Instructions

## Error: "Using engine type 'client' requires either 'adapter' or 'accelerateUrl'"

This error occurs because Prisma 7 has changed how the client is initialized. 

## Solution

### Option 1: Regenerate Prisma Client (Recommended)

```bash
# Delete existing generated client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Regenerate Prisma Client
npx prisma generate
```

### Option 2: Ensure DATABASE_URL is Set

Make sure your `.env` file has:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Option 3: Use Prisma Accelerate (Optional)

If you want to use Prisma Accelerate:
```bash
npm install @prisma/extension-accelerate
```

Then in `src/lib/prisma.js`:
```javascript
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());
```

### Option 4: Use PostgreSQL Adapter (For Custom Drivers)

If you need a custom driver adapter:
```bash
npm install @prisma/adapter-pg pg
```

Then in `src/lib/prisma.js`:
```javascript
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

## Recommended Approach

For standard PostgreSQL connections, **Option 1** (regenerate client) should work. The error typically occurs when:
1. Prisma Client wasn't generated after schema changes
2. There's a mismatch between Prisma CLI and @prisma/client versions
3. The generated client is corrupted

## Quick Fix

```bash
# 1. Clean and regenerate
npx prisma generate --force

# 2. Restart dev server
pnpm dev
```

If the error persists, check:
- Prisma version: `npx prisma --version`
- Client version: `npm list @prisma/client`
- Ensure versions match

