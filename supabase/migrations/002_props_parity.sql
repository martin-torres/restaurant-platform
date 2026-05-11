-- ============================================================================
-- Migration 002: floor_props parity with restaurant_tables
-- Gives props all editable features that tables have (names, shape, seats,
-- visibility, interactivity, availability, reservation, chair positions).
-- ============================================================================

-- New columns
alter table floor_props add column if not exists is_interactive      boolean default false;
alter table floor_props add column if not exists visible_to_customers boolean default true;
alter table floor_props add column if not exists is_available        boolean default true;
alter table floor_props add column if not exists display_name        text;
alter table floor_props add column if not exists seats               integer default 0;
alter table floor_props add column if not exists shape text not null default 'rect'
  check (shape in ('circle', 'square', 'rect', 'booth_u', 'booth_half_u', 'bar'));
alter table floor_props add column if not exists is_reserved         boolean default false;
alter table floor_props add column if not exists chair_positions     jsonb default '[]'::jsonb;
alter table floor_props add column if not exists status_color        text default 'none';
alter table floor_props add column if not exists secondary_color     text;

-- Index for fast lookup by restaurant
create index if not exists idx_floor_props_restaurant on floor_props(restaurant_id);

-- RLS: floor_props already has RLS enabled from 001. Existing policies cover
-- the new columns because they are per-row (same USING clause on restaurant_id).
-- Confirm policies exist; if not, add them.

do $$
begin
  -- Manager / staff full access for their restaurant's props
  if not exists (
    select 1 from pg_policy where polname = 'Staff can manage floor_props' and polrelid = 'floor_props'::regclass
  ) then
    create policy "Staff can manage floor_props" on floor_props
      for all using (
        restaurant_id in (
          select id from restaurants where id = floor_props.restaurant_id
        )
      );
  end if;

  -- Public read (customer view)
  if not exists (
    select 1 from pg_policy where polname = 'Public can read floor_props' and polrelid = 'floor_props'::regclass
  ) then
    create policy "Public can read floor_props" on floor_props
      for select using (true);
  end if;
end$$;

-- Auto-generate chair_positions when seats changes (mirror of table trigger)
create or replace function floor_props_auto_chairs() returns trigger as $$
begin
  if new.seats is distinct from old.seats or new.shape is distinct from old.shape
     or new.width is distinct from old.width or new.height is distinct from old.height then
    new.chair_positions := floor_props_gen_chairs(new.shape, new.seats, new.width, new.height);
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function floor_props_gen_chairs(
  p_shape  text,
  p_seats  integer,
  p_width  real,
  p_height real
) returns jsonb as $$
declare
  chairs  jsonb := '[]'::jsonb;
  inset   real  := 8;
  i       integer;
  angle   real;
  radius  real;
  cx      real;
  cy      real;
  perSide integer;
  seatsPerLong integer;
begin
  -- Mirror the client-side autoGenerateChairPositions logic
  case p_shape
    when 'circle' then
      radius := least(p_width, p_height) / 2 + inset + 12;
      cx := p_width / 2;
      cy := p_height / 2;
      for i in 0..(p_seats - 1) loop
        angle := (2 * pi() * i) / p_seats - pi() / 2;
        chairs := jsonb_set(
          chairs,
          array[jsonb_array_length(chairs)::text],
          jsonb_build_object(
            'seat_number', i + 1,
            'x', round((cx + radius * cos(angle) - 5)::numeric, 1),
            'y', round((cy + radius * sin(angle) - 5)::numeric, 1),
            'rotation', round((degrees(angle) + 90)::numeric, 0)
          )
        );
      end loop;

    when 'square' then
      perSide := greatest(1, floor(p_seats / 4));
      -- Top
      for i in 0..(perSide - 1) loop
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(perSide+1))*(i+1),1), 'y', round((-inset-10),1)));
      end loop;
      -- Bottom
      for i in 0..(perSide - 1) loop
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(perSide+1))*(i+1),1), 'y', round((p_height+inset+10),1)));
      end loop;
      -- Left
      for i in 0..(perSide - 1) loop
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((-inset-10),1), 'y', round((p_height/(perSide+1))*(i+1),1)));
      end loop;
      -- Right
      for i in 0..(perSide - 1) loop
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width+inset+10),1), 'y', round((p_height/(perSide+1))*(i+1),1)));
      end loop;
      -- Trim to p_seats
      while jsonb_array_length(chairs) > p_seats loop
        chairs := chairs - (jsonb_array_length(chairs) - 1);
      end loop;

    when 'rectangle' then
      seatsPerLong := greatest(2, floor(p_seats / 2));
      for i in 0..(seatsPerLong - 1) loop
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(seatsPerLong+1))*(i+1),1), 'y', round((-inset-10),1)));
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(seatsPerLong+1))*(i+1),1), 'y', round((p_height+inset+10),1)));
      end loop;
      if p_seats > seatsPerLong * 2 then
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', p_seats, 'x', round((-inset-10),1), 'y', round(p_height/2,1)));
      end if;

    when 'booth_u' then
      perSide := greatest(1, ceil(p_seats / 3));
      -- Top side
      for i in 0..(perSide - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(perSide+1))*(i+1),1), 'y', round((-inset-8),1)));
      end loop;
      -- Left side
      for i in 0..(perSide - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((-inset-8),1), 'y', round((p_height/(perSide+1))*(i+1),1)));
      end loop;
      -- Bottom side
      for i in 0..(perSide - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(perSide+1))*(i+1),1), 'y', round((p_height+inset+8),1)));
      end loop;

    when 'booth_half_u' then
      seatsPerLong := greatest(1, ceil(p_seats / 2));
      for i in 0..(seatsPerLong - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(seatsPerLong+1))*(i+1),1), 'y', round((-inset-8),1)));
      end loop;
      for i in 0..(seatsPerLong - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(seatsPerLong+1))*(i+1),1), 'y', round((p_height+inset+8),1)));
      end loop;

    when 'bar' then
      for i in 0..(p_seats - 1) loop
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(p_seats+1))*(i+1),1), 'y', round((-inset-12),1)));
      end loop;

    else
      -- rect or fallback: simple two-side
      seatsPerLong := greatest(1, floor(p_seats / 2));
      for i in 0..(seatsPerLong - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(seatsPerLong+1))*(i+1),1), 'y', round((-inset-10),1)));
      end loop;
      for i in 0..(seatsPerLong - 1) loop
        if jsonb_array_length(chairs) >= p_seats then exit; end if;
        chairs := jsonb_set(chairs, array[jsonb_array_length(chairs)::text],
          jsonb_build_object('seat_number', jsonb_array_length(chairs)+1, 'x', round((p_width/(seatsPerLong+1))*(i+1),1), 'y', round((p_height+inset+10),1)));
      end loop;
  end case;

  return chairs;
end;
$$ language plpgsql;

-- Drop trigger if exists, then create
drop trigger if exists trg_floor_props_auto_chairs on floor_props;
create trigger trg_floor_props_auto_chairs
  before insert or update on floor_props
  for each row execute function floor_props_auto_chairs();