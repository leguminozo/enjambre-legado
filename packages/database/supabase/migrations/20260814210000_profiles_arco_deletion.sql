-- 21.719: marca de solicitud de supresión. Las ventas/DTE se conservan (deber tributario).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.deletion_requested_at IS
  'Solicitud ARCO de eliminación. Pedidos y DTE no se borran.';
