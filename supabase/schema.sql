-- Create the gifts table
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric check (price >= 0),
  image_url text,
  product_link text,
  reserved_by text, -- null means available. If set, it contains the name of the guest.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.gifts enable row level security;

-- Policy to allow anyone to view gifts
create policy "Enable read access for all users" 
on public.gifts for select 
using (true);

-- Policy to allow reservation
-- This policy ensures that a user can only UPDATE a row if 'reserved_by' is currently NULL.
-- This handles concurrency: if two users try to update the same row, the second one will fail 
-- (or affect 0 rows) because 'reserved_by' is no longer null.
create policy "Allow reservation" 
on public.gifts for update 
using (reserved_by is null) 
with check (reserved_by is not null);
