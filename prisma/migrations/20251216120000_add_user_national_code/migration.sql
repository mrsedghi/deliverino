-- Add nationalCode column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nationalCode" TEXT;

-- Ensure nationalCode is unique when provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'users_nationalCode_key'
  ) THEN
    CREATE UNIQUE INDEX "users_nationalCode_key" ON "users"("nationalCode");
  END IF;
END $$;


