-- Migration: Add subscription tables
-- Run this against your Neon database

-- API Subscriptions table
CREATE TABLE IF NOT EXISTS api_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  tokens_allocated BIGINT NOT NULL DEFAULT 0,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Token transfers tracking
CREATE TABLE IF NOT EXISTS token_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES api_subscriptions(id) ON DELETE SET NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  amount_ngonka VARCHAR(64) NOT NULL,
  tx_hash VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_subscriptions_user_id ON api_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_subscriptions_stripe_sub_id ON api_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_api_subscriptions_status ON api_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_token_transfers_user_id ON token_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transfers_subscription_id ON token_transfers(subscription_id);
CREATE INDEX IF NOT EXISTS idx_token_transfers_status ON token_transfers(status);
CREATE INDEX IF NOT EXISTS idx_token_transfers_tx_hash ON token_transfers(tx_hash);
