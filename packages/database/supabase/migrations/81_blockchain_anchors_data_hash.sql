-- Migration 81: Add data_hash column to blockchain_anchors for verification
ALTER TABLE public.blockchain_anchors
ADD COLUMN IF NOT EXISTS data_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_data_hash ON public.blockchain_anchors(data_hash);