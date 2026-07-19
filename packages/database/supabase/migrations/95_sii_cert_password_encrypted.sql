-- Store P12 password encrypted at rest so operators configure SII entirely from the app UI
-- (no SII_P12_PASSWORD env required when cert is uploaded via Nucleo).

ALTER TABLE public.sii_certificados
  ADD COLUMN IF NOT EXISTS p12_password_encriptada TEXT;

COMMENT ON COLUMN public.sii_certificados.p12_password_encriptada IS
  'AES-GCM ciphertext (base64: iv||cipher) of the P12 password; decrypt with SII_CLAVE_ENCRYPTION_KEY server-side only';
