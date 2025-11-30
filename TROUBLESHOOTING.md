# Prisma Database Connection Troubleshooting

## Error: "The requested endpoint could not be found"

This error means Prisma cannot connect to your PostgreSQL database.

## Step 1: Check if .env file exists

Make sure you have a `.env` file in the project root with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

## Step 2: Verify DATABASE_URL format

The format should be:
```
postgresql://username:password@localhost:5432/database_name
```

Example for local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/deliverino"
```

## Step 3: Create the database (if it doesn't exist)

If the database doesn't exist, create it first:

```bash
# Connect to PostgreSQL
psql -U postgres

# Then create the database
CREATE DATABASE deliverino;

# Exit
\q
```

## Step 4: Verify PostgreSQL is running

- **Windows**: Check Services (services.msc) for "PostgreSQL"
- **Mac/Linux**: `sudo systemctl status postgresql` or `brew services list`

## Step 5: Test the connection

After setting up your `.env` file, try:

```bash
# Generate Prisma Client first
npx prisma generate

# Then try db push
npx prisma db push
```

## Common Issues

1. **Database doesn't exist**: Create it using `CREATE DATABASE` command
2. **Wrong credentials**: Double-check username and password
3. **Wrong port**: Default PostgreSQL port is 5432
4. **PostgreSQL not running**: Start the PostgreSQL service
5. **Firewall blocking**: Check if firewall allows connections on port 5432

