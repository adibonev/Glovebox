-- Documents: a user-uploaded file (PDF or image) attached to a Service Record.
-- (UBIQUITOUS_LANGUAGE.md — a Service Record has zero or more Documents.)
--
-- Files live in the PRIVATE `documents` storage bucket under the path
--   {auth.uid()}/{service_id}/{uuid}__{filename}
-- and their metadata lives in public.documents. RLS scopes both the rows and the
-- storage objects to the owning User. Additive migration — nothing is dropped.

-- 1) Metadata table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id          BIGSERIAL PRIMARY KEY,
  service_id  BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  name        TEXT   NOT NULL,
  path        TEXT   NOT NULL UNIQUE,
  mime_type   TEXT,
  size_bytes  BIGINT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_service_id ON public.documents (service_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id    ON public.documents (user_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Owner can read / add / remove their own Document rows. (DROP-then-CREATE keeps
-- this migration safe to re-run, e.g. via the SQL editor and `supabase db push`.)
DROP POLICY IF EXISTS "Users can view own documents"   ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents"  ON public.documents;

CREATE POLICY "Users can view own documents"   ON public.documents
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Admins (is_admin) can view all, consistent with the existing admin policies.
CREATE POLICY "Admins can view all documents"  ON public.documents
  FOR SELECT USING (public.is_admin());

-- 2) Private storage bucket for the files -------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: a User may manage only objects whose first path segment is their
-- own auth uid. Uploads/reads/deletes run as the User's session, so this keeps
-- every file private to its owner without any service-role access.
DROP POLICY IF EXISTS "Users read own document files"   ON storage.objects;
DROP POLICY IF EXISTS "Users upload own document files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own document files" ON storage.objects;

CREATE POLICY "Users read own document files"   ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own document files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own document files" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
