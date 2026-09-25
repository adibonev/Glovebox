-- Shared Vehicles: two people in a family following one car. The owner sends a one-time link;
-- whoever opens it while signed in becomes a Vehicle Member: they see and edit the car's Service
-- Records, Documents and Mileage Readings, and get its Reminders. Only the owner deletes the car,
-- shares it, or makes its passport. A member can leave; the owner can remove a member.
--
-- Everything here is ADDITIVE. The existing owner policies are untouched; the new policies are
-- permissive, so Postgres ORs them with the old ones and no one loses access they had.
--
-- Rows a member creates on a shared car carry the OWNER's user_id (services, mileage_readings,
-- documents), exactly as if the owner had entered them: every existing owner query keeps working.
-- Re-runnable.

-- 1. Who can see which car ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.vehicle_members (
  car_id     INTEGER NOT NULL REFERENCES public.cars(id)  ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (car_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_vehicle_members_user_id ON public.vehicle_members (user_id);

-- A one-time invitation to a car. The token is the whole secret (122 random bits); it works once,
-- for seven days.
CREATE TABLE IF NOT EXISTS public.vehicle_invites (
  token      TEXT PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  car_id     INTEGER NOT NULL REFERENCES public.cars(id)  ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  used_by    INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vehicle_invites_car_id ON public.vehicle_invites (car_id);

-- 2. Helpers. SECURITY DEFINER so a policy can ask them without recursing through RLS. -----------

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.shared_car_ids()
RETURNS SETOF integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT car_id FROM public.vehicle_members WHERE user_id = public.current_user_id()
$$;

CREATE OR REPLACE FUNCTION public.owned_car_ids()
RETURNS SETOF integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.cars WHERE user_id = public.current_user_id()
$$;

-- The owner of a car as stored, whatever an UPDATE is trying to change it to.
CREATE OR REPLACE FUNCTION public.car_owner(car integer)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.cars WHERE id = car
$$;

-- Storage paths of every Document on a car the signed-in User owns or shares.
CREATE OR REPLACE FUNCTION public.readable_document_paths()
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.path
    FROM public.documents d
    JOIN public.services s ON s.id = d.service_id
   WHERE s.car_id IN (SELECT public.owned_car_ids()) OR s.car_id IN (SELECT public.shared_car_ids())
$$;

-- 3. Policies ----------------------------------------------------------------------------------

ALTER TABLE public.vehicle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members and owners see memberships" ON public.vehicle_members;
DROP POLICY IF EXISTS "Members leave, owners remove"       ON public.vehicle_members;
CREATE POLICY "Members and owners see memberships" ON public.vehicle_members
  FOR SELECT USING (user_id = public.current_user_id() OR car_id IN (SELECT public.owned_car_ids()));
CREATE POLICY "Members leave, owners remove" ON public.vehicle_members
  FOR DELETE USING (user_id = public.current_user_id() OR car_id IN (SELECT public.owned_car_ids()));
-- No INSERT policy: joining goes through join_vehicle(), which checks the invitation.

DROP POLICY IF EXISTS "Owners manage invites" ON public.vehicle_invites;
CREATE POLICY "Owners manage invites" ON public.vehicle_invites
  FOR ALL USING (car_id IN (SELECT public.owned_car_ids()))
  WITH CHECK (car_id IN (SELECT public.owned_car_ids()) AND created_by = public.current_user_id());

-- cars: members read and edit, never delete, never take ownership.
DROP POLICY IF EXISTS "Members view shared cars"   ON public.cars;
DROP POLICY IF EXISTS "Members update shared cars" ON public.cars;
CREATE POLICY "Members view shared cars" ON public.cars
  FOR SELECT USING (id IN (SELECT public.shared_car_ids()));
CREATE POLICY "Members update shared cars" ON public.cars
  FOR UPDATE USING (id IN (SELECT public.shared_car_ids()))
  WITH CHECK (id IN (SELECT public.shared_car_ids()) AND user_id = public.car_owner(id));

-- services: members do everything on a shared car's Service Records, in the owner's name.
DROP POLICY IF EXISTS "Members view shared services"   ON public.services;
DROP POLICY IF EXISTS "Members insert shared services" ON public.services;
DROP POLICY IF EXISTS "Members update shared services" ON public.services;
DROP POLICY IF EXISTS "Members delete shared services" ON public.services;
CREATE POLICY "Members view shared services" ON public.services
  FOR SELECT USING (car_id IN (SELECT public.shared_car_ids()));
CREATE POLICY "Members insert shared services" ON public.services
  FOR INSERT WITH CHECK (car_id IN (SELECT public.shared_car_ids()) AND user_id = public.car_owner(car_id));
CREATE POLICY "Members update shared services" ON public.services
  FOR UPDATE USING (car_id IN (SELECT public.shared_car_ids()))
  WITH CHECK (car_id IN (SELECT public.shared_car_ids()) AND user_id = public.car_owner(car_id));
CREATE POLICY "Members delete shared services" ON public.services
  FOR DELETE USING (car_id IN (SELECT public.shared_car_ids()));

-- mileage_readings: the same, in the owner's name.
DROP POLICY IF EXISTS "Members view shared mileage"   ON public.mileage_readings;
DROP POLICY IF EXISTS "Members insert shared mileage" ON public.mileage_readings;
DROP POLICY IF EXISTS "Members update shared mileage" ON public.mileage_readings;
CREATE POLICY "Members view shared mileage" ON public.mileage_readings
  FOR SELECT USING (car_id IN (SELECT public.shared_car_ids()));
CREATE POLICY "Members insert shared mileage" ON public.mileage_readings
  FOR INSERT WITH CHECK (car_id IN (SELECT public.shared_car_ids()) AND user_id = public.car_owner(car_id));
CREATE POLICY "Members update shared mileage" ON public.mileage_readings
  FOR UPDATE USING (car_id IN (SELECT public.shared_car_ids()))
  WITH CHECK (car_id IN (SELECT public.shared_car_ids()) AND user_id = public.car_owner(car_id));

-- renewals: members read the history.
DROP POLICY IF EXISTS "Members view shared renewals" ON public.renewals;
CREATE POLICY "Members view shared renewals" ON public.renewals
  FOR SELECT USING (car_id IN (SELECT public.shared_car_ids()));

-- documents: rows on shared cars, in the owner's name; files readable by owner and members alike.
DROP POLICY IF EXISTS "Members view shared documents"   ON public.documents;
DROP POLICY IF EXISTS "Members insert shared documents" ON public.documents;
DROP POLICY IF EXISTS "Members delete shared documents" ON public.documents;
CREATE POLICY "Members view shared documents" ON public.documents
  FOR SELECT USING (path IN (SELECT public.readable_document_paths()));
CREATE POLICY "Members insert shared documents" ON public.documents
  FOR INSERT WITH CHECK (
    service_id IN (SELECT id FROM public.services WHERE car_id IN (SELECT public.shared_car_ids()))
    AND user_id = public.car_owner((SELECT car_id FROM public.services WHERE id = service_id))
  );
CREATE POLICY "Members delete shared documents" ON public.documents
  FOR DELETE USING (path IN (SELECT public.readable_document_paths()));

DROP POLICY IF EXISTS "Read document files of shared cars"   ON storage.objects;
DROP POLICY IF EXISTS "Delete document files of shared cars" ON storage.objects;
CREATE POLICY "Read document files of shared cars" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND name IN (SELECT public.readable_document_paths()));
CREATE POLICY "Delete document files of shared cars" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND name IN (SELECT public.readable_document_paths()));

-- 4. Joining, and who is on a car --------------------------------------------------------------

-- Accept an invitation for the signed-in User. Returns the car's id, or NULL when the token is
-- unknown, used or expired. Opening one's own invitation changes nothing.
CREATE OR REPLACE FUNCTION public.join_vehicle(invite text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me integer := public.current_user_id();
  car integer;
BEGIN
  IF me IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT car_id INTO car
    FROM public.vehicle_invites
   WHERE token = invite AND used_at IS NULL AND expires_at > now();
  IF car IS NULL THEN
    RETURN NULL;
  END IF;

  IF public.car_owner(car) = me THEN
    RETURN car;
  END IF;

  INSERT INTO public.vehicle_members (car_id, user_id) VALUES (car, me) ON CONFLICT DO NOTHING;
  UPDATE public.vehicle_invites SET used_by = me, used_at = now() WHERE token = invite;
  RETURN car;
END;
$$;

-- The people on a car (owner first), for its owner and its members only. Users cannot read each
-- other's rows, so the names and e-mails come through here.
CREATE OR REPLACE FUNCTION public.vehicle_people(car integer)
RETURNS TABLE (user_id integer, email text, name text, is_owner boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.name, u.id = c.user_id
    FROM public.cars c
    JOIN public.users u ON u.id = c.user_id OR u.id IN (SELECT m.user_id FROM public.vehicle_members m WHERE m.car_id = c.id)
   WHERE c.id = car
     AND (c.user_id = public.current_user_id() OR c.id IN (SELECT public.shared_car_ids()))
   ORDER BY u.id = c.user_id DESC, u.id
$$;

REVOKE ALL ON FUNCTION public.join_vehicle(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vehicle_people(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_vehicle(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vehicle_people(integer) TO authenticated;
