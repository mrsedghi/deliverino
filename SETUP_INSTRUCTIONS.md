# Prisma Setup Instructions

## Step 1: Generate Prisma Client

First, generate the Prisma Client (this works even without a database connection):

```bash
npx prisma generate
```

## Step 2: Set up your .env file

Create a `.env` file in the project root with your database URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

Example for local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/deliverino"
```

## Step 3: Create the database (if it doesn't exist)

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE deliverino;

# Exit
\q
```

## Step 4: Push schema to database

Now you can push your schema to the database:

```bash
npx prisma db push
```

Or create a migration:

```bash
npx prisma migrate dev --name init
```

## Step 5: Test the connection (optional)

```bash
node test-db-connection.js
```

## Troubleshooting

### Error: "Cannot read properties of undefined (reading '__internal')"
- **Solution**: Run `npx prisma generate` first

### Error: "The requested endpoint could not be found"
- **Solution**: 
  1. Check if DATABASE_URL is set in .env
  2. Verify PostgreSQL is running
  3. Make sure the database exists
  4. Check connection string format

### Error: "Schema engine error"
- **Solution**: Make sure your DATABASE_URL is correct and the database server is accessible

