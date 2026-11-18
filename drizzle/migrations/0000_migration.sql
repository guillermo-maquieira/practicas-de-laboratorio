CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  last text NOT NULL,
  repo text NOT NULL,
  date text NOT NULL,
  percent integer,
  review text,
  override_date text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can register" ON public.students FOR INSERT WITH CHECK (percent IS NULL AND review IS NULL AND override_date IS NULL AND approved = false);