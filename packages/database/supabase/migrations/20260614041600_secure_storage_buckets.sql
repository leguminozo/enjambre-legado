-- Migration: 20260614041600_secure_storage_buckets
-- Purpose: Configure file size limits and allowed MIME types for storage buckets

-- 1. Avatars bucket: images only, max 50MB
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    file_size_limit = 52428800
WHERE id = 'avatars';

-- 2. Productos bucket: images only, max 50MB
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    file_size_limit = 52428800
WHERE id = 'productos';

-- 3. CMS bucket: images and PDF, max 50MB
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    file_size_limit = 52428800
WHERE id = 'cms';

-- 4. SII Certificados bucket: PDF, XML and PKCS12 (p12/pfx certificates), max 50MB
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'application/xml', 'text/xml', 'application/x-pkcs12'],
    file_size_limit = 52428800
WHERE id = 'sii-certificados';
