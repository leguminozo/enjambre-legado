-- Migration: payment_failures
-- Purpose: Dead letter queue for failed payment webhooks and retries
-- Fixes: Enables retry logic for Transbank webhooks, prevents payment data loss

CREATE TABLE IF NOT EXISTS payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id UUID NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('transbank', 'flow')),
  webhook_payload JSONB NOT NULL,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'failed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_failures_checkout_session ON payment_failures(checkout_session_id);
CREATE INDEX idx_payment_failures_status ON payment_failures(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_payment_failures_next_retry ON payment_failures(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Function to increment retry count and schedule next retry
CREATE OR REPLACE FUNCTION schedule_payment_retry(p_failure_id UUID)
RETURNS void AS $$
DECLARE
  v_failure RECORD;
  v_backoff_seconds INT;
BEGIN
  SELECT * INTO v_failure FROM payment_failures WHERE id = p_failure_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment failure not found';
  END IF;
  
  IF v_failure.retry_count >= v_failure.max_retries THEN
    UPDATE payment_failures
    SET status = 'failed',
        updated_at = now()
    WHERE id = p_failure_id;
    RETURN;
  END IF;
  
  -- Exponential backoff: 30s, 2min, 8min
  v_backoff_seconds := 30 * POWER(2, v_failure.retry_count);
  
  UPDATE payment_failures
  SET retry_count = retry_count + 1,
      next_retry_at = now() + (v_backoff_seconds || ' seconds')::INTERVAL,
      status = 'retrying',
      updated_at = now()
  WHERE id = p_failure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark as resolved
CREATE OR REPLACE FUNCTION resolve_payment_failure(p_failure_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE payment_failures
  SET status = 'resolved',
      resolved_at = now(),
      updated_at = now()
  WHERE id = p_failure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on payment_failures"
  ON payment_failures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON payment_failures FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON payment_failures TO service_role;
GRANT EXECUTE ON FUNCTION schedule_payment_retry(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_payment_failure(UUID) TO service_role;
