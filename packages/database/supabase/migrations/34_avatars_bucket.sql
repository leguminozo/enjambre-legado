INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_avatars_read ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_insert ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_update ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_delete ON storage.objects;

CREATE POLICY storage_avatars_read ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY storage_avatars_insert ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY storage_avatars_update ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

CREATE POLICY storage_avatars_delete ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'avatars');
