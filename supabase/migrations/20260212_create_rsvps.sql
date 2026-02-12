-- Create rsvps table
create table if not exists rsvps (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  confirmed boolean default true
);

-- Set up RLS (Row Level Security)
alter table rsvps enable row level security;

-- Allow public insert (since anyone can RSVP)
create policy "Enable insert for everyone" on rsvps for insert with check (true);

-- Allow public read (optional, maybe restrict later if needed, but for now admin needs to read)
-- Actually, maybe we only want admin to read. But for simplicity let's allow read for now or just service role.
-- Wait, the admin panel uses the same supabase client but might use a secret key or just RLS policies if authenticated.
-- The current project seems to use a "secret key" simulated auth or maybe just open policies for some things.
-- Looking at `AdminPanel.jsx`, it uses `supabase` client.
-- Let's check `lib/supabaseClient.js`. It uses `createClient(supabaseUrl, supabaseAnonKey)`.
-- So public policies are needed for the anon key to read/write unless we use a service role key (which isn't in the frontend usually).
-- However, `AdminPanel` has `p_secret_key` in its RPC calls, suggesting some backend logic handles auth for sensitive things.
-- But for `rsvps`, the user just inserts. The admin reads.
-- Let's allow public insert.
-- Let's allow public read for now to ensure AdminPanel works without complex auth setup, 
-- or better, let's see how `gifts` is handled. Users read gifts. Admin writes gifts.
-- For RSVPs: Users WRITE. Admin READS.
-- So:
create policy "Enable read for everyone" on rsvps for select using (true);

-- Enable delete for everyone (AdminPanel delete button needs this if not using RPC)
-- If using RPC, the RPC likely bypasses RLS if created with `security definer`.
-- Let's add a simple delete policy for now or rely on RPC.
-- Since I'll add an RPC for deleting/managing, I might not need delete policy for anon.
-- But wait, `AdminPanel` uses `supabase.from('gifts')` directly for reading.
-- So `rsvps` will likely be read directly too.
