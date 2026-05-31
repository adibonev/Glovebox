-- Seed data for manual viewing in the dev dashboard.
-- Runs on `supabase db reset`. Idempotent — safe to re-run.
-- One demo User with one Vehicle and three obligations (Service Records).

insert into public.users (email, name)
values ('demo@glovebox.test', 'Demo User')
on conflict (email) do nothing;

insert into public.cars (user_id, brand, model, year, license_plate)
select u.id, 'Toyota', 'Corolla', 2019, 'CA1234BX'
from public.users u
where u.email = 'demo@glovebox.test'
  and not exists (
    select 1 from public.cars c
    where c.user_id = u.id and c.license_plate = 'CA1234BX'
  );

insert into public.services (car_id, user_id, service_type, expiry_date)
select c.id, c.user_id, v.service_type, v.expiry_date
from public.cars c
join public.users u on u.id = c.user_id and u.email = 'demo@glovebox.test'
cross join (values
  ('civil_liability', date '2026-06-20'),
  ('vignette',        date '2026-06-10'),
  ('inspection',      date '2026-09-01')
) as v(service_type, expiry_date)
where c.license_plate = 'CA1234BX'
  and not exists (
    select 1 from public.services s
    where s.car_id = c.id and s.service_type = v.service_type
  );
