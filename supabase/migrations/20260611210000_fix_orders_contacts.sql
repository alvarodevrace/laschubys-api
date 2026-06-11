-- Fix orders/checkout schema to match the anonymous-checkout contract.
-- Drops the unused user-centric order tables and recreates them with the
-- fields the API and frontend expect. Also creates the contacts table.

begin;

-- Remove old order_items first because of FK to orders.
drop table if exists laschubys.order_items;

-- Recreate orders with the checkout-anon contract.
drop table if exists laschubys.orders;

create table laschubys.orders (
    id uuid default gen_random_uuid() not null primary key,
    name text not null,
    phone text not null,
    email text not null,
    province text not null,
    address text not null,
    notes text,
    items jsonb not null default '[]'::jsonb,
    total numeric not null default 0,
    status text default 'pending'::text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint orders_status_check check (
        status = any (array['pending'::text, 'paid'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])
    )
);

-- contacts table (was missing in the live DB).
create table if not exists laschubys.contacts (
    id uuid default gen_random_uuid() not null primary key,
    name text not null,
    email text not null,
    message text not null,
    created_at timestamp with time zone default now(),
    constraint contacts_message_check check (char_length(message) <= 2000)
);

-- Updated-at trigger already exists, reuse it.
create trigger trg_lch_orders_updated_at
    before update on laschubys.orders
    for each row execute function laschubys.update_updated_at_column();

-- Row Level Security
alter table laschubys.orders enable row level security;
alter table laschubys.contacts enable row level security;

-- Drop old policies if they exist.
drop policy if exists lch_orders_insert on laschubys.orders;
drop policy if exists lch_orders_select on laschubys.orders;
drop policy if exists lch_orders_update on laschubys.orders;
drop policy if exists lch_contacts_select on laschubys.contacts;
drop policy if exists lch_contacts_delete on laschubys.contacts;

-- Orders: only service_role can insert; only admins can read/update.
create policy lch_orders_insert on laschubys.orders
    for insert with check ((auth.role() = 'service_role'::text));

create policy lch_orders_select on laschubys.orders
    for select using (laschubys.is_admin());

create policy lch_orders_update on laschubys.orders
    for update using (laschubys.is_admin());

-- Contacts: only service_role can insert; only admins can read/delete.
create policy lch_contacts_insert on laschubys.contacts
    for insert with check ((auth.role() = 'service_role'::text));

create policy lch_contacts_select on laschubys.contacts
    for select using (laschubys.is_admin());

create policy lch_contacts_delete on laschubys.contacts
    for delete using (laschubys.is_admin());

commit;
