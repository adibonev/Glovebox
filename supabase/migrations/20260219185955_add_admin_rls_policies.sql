-- Admin RLS helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE auth_user_id = auth.uid()),
    false
  );
$$;

-- Admin policies: view/update all users
CREATE POLICY "Admins can view all users"   ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (public.is_admin());

-- Admin policies: view/delete all cars
CREATE POLICY "Admins can view all cars"   ON public.cars FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete all cars" ON public.cars FOR DELETE USING (public.is_admin());

-- Admin policies: view/delete all services
CREATE POLICY "Admins can view all services"   ON public.services FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete all services" ON public.services FOR DELETE USING (public.is_admin());
