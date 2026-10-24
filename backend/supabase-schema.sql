-- Baker's Garage OS: staged Supabase/PostgreSQL schema (not deployed).
-- Create and test against a private Supabase project before using real customer data.
-- Row-level security is owner-scoped. Public/anonymous users receive no access.
create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legal_name text not null default 'Baker''s Automotive Repair LLC',
  phone text,
  email text,
  created_at timestamptz not null default now(),
  unique (id, owner_user_id)
);
create index if not exists shops_owner_idx on public.shops(owner_user_id);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  company text,
  type text not null default 'Retail' check (type in ('Retail','Fleet')),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  unique (shop_id, id)
);
create index if not exists customers_shop_idx on public.customers(shop_id);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null,
  model_year integer check (model_year between 1900 and 2100),
  make text not null,
  model text not null,
  plate text,
  vin text check (length(vin) <= 17),
  mileage integer check (mileage >= 0),
  next_service_date date,
  created_at timestamptz not null default now(),
  foreign key (shop_id, customer_id) references public.customers(shop_id,id) on delete restrict,
  unique (shop_id, id)
);
create index if not exists vehicles_shop_customer_idx on public.vehicles(shop_id,customer_id);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  vehicle_id uuid not null,
  title text not null,
  status text not null default 'Estimate'
    check (status in ('Estimate','Awaiting Approval','In Progress','Completed','Paid','Cancelled')),
  service_date date,
  labor_hours numeric(12,2) not null default 0 check (labor_hours >= 0),
  labor_rate numeric(12,2) not null default 150 check (labor_rate >= 0),
  parts_subtotal numeric(12,2) not null default 0 check (parts_subtotal >= 0),
  parts_details text,
  description text,
  recommendations text,
  warranty text,
  created_at timestamptz not null default now(),
  foreign key (shop_id,vehicle_id) references public.vehicles(shop_id,id) on delete restrict
);
create index if not exists work_orders_shop_date_idx on public.work_orders(shop_id,service_date desc);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  vehicle_id uuid not null,
  inspection_date date not null default current_date,
  mileage integer check (mileage >= 0),
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  foreign key (shop_id,vehicle_id) references public.vehicles(shop_id,id) on delete restrict
);
create index if not exists inspections_shop_date_idx on public.inspections(shop_id,inspection_date desc);

create table if not exists public.approval_records (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  customer_full_name text not null,
  authorized_amount numeric(12,2) not null check (authorized_amount >= 0),
  authorization_method text not null check (authorization_method in ('written','text','email','other')),
  original_message_reference text,
  recorded_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now()
);
create index if not exists approvals_shop_order_idx on public.approval_records(shop_id,work_order_id);

alter table public.shops enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.work_orders enable row level security;
alter table public.inspections enable row level security;
alter table public.approval_records enable row level security;

drop policy if exists shops_owner_policy on public.shops;
create policy shops_owner_policy on public.shops for all to authenticated
using(owner_user_id=(select auth.uid()))
with check(owner_user_id=(select auth.uid()));

drop policy if exists customers_owner_policy on public.customers;
create policy customers_owner_policy on public.customers for all to authenticated
using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())));

drop policy if exists vehicles_owner_policy on public.vehicles;
create policy vehicles_owner_policy on public.vehicles for all to authenticated
using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())));

drop policy if exists work_orders_owner_policy on public.work_orders;
create policy work_orders_owner_policy on public.work_orders for all to authenticated
using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())));

drop policy if exists inspections_owner_policy on public.inspections;
create policy inspections_owner_policy on public.inspections for all to authenticated
using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())));

drop policy if exists approvals_owner_policy on public.approval_records;
create policy approvals_owner_policy on public.approval_records for all to authenticated
using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_user_id=(select auth.uid())) and recorded_by=(select auth.uid()));

-- Additional server-side validation is still needed for production:
-- Verify approval_records.work_order_id belongs to its shop_id.
-- Enforce verified email/customer identity before accepting customer approvals.
-- Build customer-facing intake via a rate-limited edge function, never anon INSERT into customer tables.
-- Define retention and privacy policies before storing personal customer data.
