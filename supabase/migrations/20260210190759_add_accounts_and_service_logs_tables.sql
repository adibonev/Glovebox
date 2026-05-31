-- Initial schema: users, cars, services, accounts, service_logs, admins

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR,
  email       VARCHAR UNIQUE NOT NULL,
  reminder_days INTEGER DEFAULT 30,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- auth_user_id links a profile row to its Supabase auth identity (auth.users.id).
-- In production this column predates these migrations (it was added to the live
-- `users` table outside migration tracking), so the RLS policies below could already
-- reference it. We add it here so the migrations also apply cleanly to an EMPTY dev DB.
-- Idempotent: the later 20260211181847 migration's "ADD COLUMN IF NOT EXISTS auth_user_id"
-- becomes a no-op; its index and FK to auth.users are still applied there. The final
-- schema is unchanged (same column, same UUID type) — only its creation point moves earlier.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert user"   ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- CARS
CREATE TABLE IF NOT EXISTS public.cars (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brand         VARCHAR NOT NULL,
  model         VARCHAR NOT NULL,
  year          INTEGER,
  license_plate VARCHAR,
  vin           VARCHAR,
  color         VARCHAR,
  engine_type   VARCHAR,
  euro_standard VARCHAR,
  fuel_type     VARCHAR,
  tire_width    INTEGER,
  tire_height   INTEGER,
  tire_diameter INTEGER,
  tire_season   VARCHAR,
  tire_brand    VARCHAR,
  tire_dot      VARCHAR,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cars"   ON public.cars FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert own cars" ON public.cars FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update own cars" ON public.cars FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own cars" ON public.cars FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_cars_user_id ON public.cars (user_id);

-- SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id            SERIAL PRIMARY KEY,
  car_id        INTEGER NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_type  VARCHAR NOT NULL,
  expiry_date   DATE,
  cost          NUMERIC(10,2),
  liters        NUMERIC(10,2),
  price_per_liter NUMERIC(10,4),
  fuel_type     VARCHAR,
  notes         TEXT,
  mileage       INTEGER,
  file_url      TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services for own cars"   ON public.services FOR SELECT USING (car_id IN (SELECT c.id FROM cars c JOIN users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid()));
CREATE POLICY "Users can insert services for own cars" ON public.services FOR INSERT WITH CHECK (car_id IN (SELECT c.id FROM cars c JOIN users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid()));
CREATE POLICY "Users can update services for own cars" ON public.services FOR UPDATE USING (car_id IN (SELECT c.id FROM cars c JOIN users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid()));
CREATE POLICY "Users can delete services for own cars" ON public.services FOR DELETE USING (car_id IN (SELECT c.id FROM cars c JOIN users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_services_car_id    ON public.services (car_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id   ON public.services (user_id);
CREATE INDEX IF NOT EXISTS idx_services_expiry_date ON public.services (expiry_date);

-- ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       VARCHAR,
  email      VARCHAR,
  phone      VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"   ON public.accounts FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts (user_id);

-- SERVICE_LOGS
CREATE TABLE IF NOT EXISTS public.service_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  car_id       INTEGER REFERENCES public.cars(id) ON DELETE SET NULL,
  email        VARCHAR,
  service_type VARCHAR,
  expiry_date  DATE,
  sent_at      TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_logs_user_id     ON public.service_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_email       ON public.service_logs (email);
CREATE INDEX IF NOT EXISTS idx_service_logs_service_type ON public.service_logs (service_type);
CREATE INDEX IF NOT EXISTS idx_service_logs_created_at  ON public.service_logs (created_at);

-- ADMINS (legacy table kept for compatibility)
CREATE TABLE IF NOT EXISTS public.admins (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR UNIQUE NOT NULL,
  email      VARCHAR NOT NULL,
  password   VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
