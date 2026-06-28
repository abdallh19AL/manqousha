-- Add customer_code column to profiles (was never created in earlier migrations)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS customer_code TEXT;

-- Backfill existing rows that have null customer_code
UPDATE profiles
SET customer_code = upper(substr(md5(random()::text || id::text), 1, 6))
WHERE customer_code IS NULL;

-- Set a default so new profile rows get a code automatically
ALTER TABLE profiles
ALTER COLUMN customer_code SET DEFAULT upper(substr(md5(random()::text), 1, 6));

-- Unique index so the admin lookup by customer_code is fast and collision-safe
CREATE UNIQUE INDEX IF NOT EXISTS profiles_customer_code_idx ON profiles (customer_code);
