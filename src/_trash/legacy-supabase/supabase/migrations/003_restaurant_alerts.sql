-- ============================================================================
-- Migration 003: Missing restaurant_alerts table
-- Required by: owner.ts (alert counts on owner dashboard)
-- ============================================================================

create table if not exists restaurant_alerts (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  message         text not null,
  severity        text default 'warning' check (severity in ('info', 'warning', 'critical')),
  resolved        boolean default false,
  resolved_at     timestamptz,
  created_at      timestamptz default now()
);

create index if not exists idx_restaurant_alerts_restaurant on restaurant_alerts(restaurant_id);
create index if not exists idx_restaurant_alerts_resolved on restaurant_alerts(resolved);

-- RLS
alter table restaurant_alerts enable row level security;

-- Owners can see alerts for their restaurants
create policy "Owners can see their restaurant alerts" on restaurant_alerts
  for select using (
    restaurant_id in (
      select id from restaurants where id = restaurant_alerts.restaurant_id
    )
  );

-- Owners can insert alerts
create policy "Owners can create restaurant alerts" on restaurant_alerts
  for insert with check (
    restaurant_id in (
      select id from restaurants where id = restaurant_alerts.restaurant_id
    )
  );

-- Owners can update (resolve) alerts
create policy "Owners can update their alerts" on restaurant_alerts
  for update using (
    restaurant_id in (
      select id from restaurants where id = restaurant_alerts.restaurant_id
    )
  );