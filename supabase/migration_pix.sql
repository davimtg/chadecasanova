-- Create Pix Donations Table
CREATE TABLE IF NOT EXISTS public.pix_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    donor_name TEXT NOT NULL,
    message TEXT,
    amount NUMERIC(10, 2) NOT NULL, -- Value in Reais (e.g. 50.00)
    status TEXT DEFAULT 'pending' -- pending, received
);

-- Enable RLS
ALTER TABLE public.pix_donations ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can INSERT (anyone can donate)
CREATE POLICY "Public can insert donations" 
ON public.pix_donations FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Only Admin can VIEW/SELECT (controlled via application logic/RPC or simply expose to anon if low risk, but let's restrict to service_role or authenticated in app if possible. 
-- For simplicity in this app without auth users, we might need to allow Public Read if we wanted to show a "Recent Donors" list, but the user only asked for Admin Panel.
-- However, standard practice: Public Insert, Admin Select.
-- Since the AdminPanel uses the same supabase client (anon key) but checks a password, we might need to allow SELECT to public OR wrap it in an RPC.
-- Given the current pattern in `AdminPanel.jsx` reads `gifts` directly, `gifts` is public.
-- The user didn't specify strict auth for database reads, but let's allow SELECT for now so the AdminPanel can read it easily without an RPC. 
-- Ideally we would use the `secure` RPC pattern for everything sensitive.
-- Let's stick to the pattern: Allow Public Select for simplicity in this "friend/family" app context, OR use an RPC for "get_donations(secret)".
-- Let's make an RPC for fetching donations to keep it somewhat hidden.

CREATE POLICY "Allow public insert" ON public.pix_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Deny public select" ON public.pix_donations FOR SELECT USING (false); 
-- (Actually, let's just make an RPC to list them, safer)

-- RPC to list donations (Protected by secret)
CREATE OR REPLACE FUNCTION admin_get_pix_donations(p_secret_key text)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    donor_name TEXT,
    message TEXT,
    amount NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_secret text := 'davilarimo';
BEGIN
  IF p_secret_key != v_admin_secret THEN
    RETURN; -- Returns empty
  END IF;

  RETURN QUERY SELECT d.id, d.created_at, d.donor_name, d.message, d.amount, d.status 
  FROM public.pix_donations d
  ORDER BY d.created_at DESC;
END;
$$;
