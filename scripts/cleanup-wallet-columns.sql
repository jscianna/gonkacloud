-- Migration: Remove wallet-related columns (single shared wallet architecture)
-- Run this in Neon SQL Editor after deploying the code changes

-- Drop wallet columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS gonka_address;
ALTER TABLE users DROP COLUMN IF EXISTS encrypted_private_key;
ALTER TABLE users DROP COLUMN IF EXISTS encrypted_mnemonic;
ALTER TABLE users DROP COLUMN IF EXISTS inference_registered;
ALTER TABLE users DROP COLUMN IF EXISTS inference_registered_at;
ALTER TABLE users DROP COLUMN IF EXISTS balance_usd;

-- Drop token_transfers table (no longer needed)
DROP TABLE IF EXISTS token_transfers;

-- Verify the cleanup
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
