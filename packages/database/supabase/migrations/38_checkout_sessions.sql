-- Migration: 38_checkout_sessions
-- Purpose: Replace in-memory Map with persistent checkout sessions in Postgres.
-- Fixes: Data loss in serverless (Vercel cold starts), enables idempotent webhooks,
-- provides audit trail, and allows atomic venta+stock transaction.

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('transbank', 'flow')),
  cart JSONB NOT NULL,
  total INTEGER NOT NULL CHECK (total > 0),
  shipping JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_buy_order
  ON checkout_sessions (buy_order);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status
  ON checkout_sessions (status) WHERE status = 'pending';

-- Auto-expire pending sessions older than 30 minutes
CREATE OR REPLACE FUNCTION expire_checkout_sessions()
RETURNS void AS $$
  UPDATE checkout_sessions
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < now() - interval '30 minutes';
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS: only service_role can operate on checkout_sessions.
-- Web checkout uses admin client (service_role) for all operations.
-- No direct client access — sessions are server-side only.
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on checkout_sessions"
  ON checkout_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Prevent authenticated/anon from reading or writing checkout data
REVOKE ALL ON checkout_sessions FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON checkout_sessions TO service_role;

-- Grant execute on expire function to service_role
GRANT EXECUTE ON FUNCTION expire_checkout_sessions() TO service_role;
