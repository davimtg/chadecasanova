-- Create access_logs table
create table if not exists access_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ip_address text,
  user_agent text,
  location text
);

-- Enable RLS
alter table access_logs enable row level security;

-- Allow public insert (to log visits)
create policy "Enable insert for everyone" on access_logs for insert with check (true);

-- Allow public read (for admin panel, assuming same pattern as other tables)
create policy "Enable read for everyone" on access_logs for select using (true);
