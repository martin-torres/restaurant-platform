# PocketBase backend

Local backend for the restaurant platform.

## Quick start

```bash
# 1. Download PocketBase (linux amd64 example)
curl -sL https://github.com/pocketbase/pocketbase/releases/download/v0.25.9/pocketbase_0.25.9_linux_amd64.zip -o /tmp/pb.zip
unzip -o /tmp/pb.zip -d pocketbase/

# 2. Create admin (first time)
./pocketbase/pocketbase superuser upsert admin@restaurant.local admin123456 --dir=./pocketbase/pb_data

# 3. Serve
npm run pb:serve

# 4. Create collections + seed demo restaurant
npm run pb:setup
```

Dashboard: http://127.0.0.1:8090/_/

## Demo credentials

| Role | Access |
|------|--------|
| Customer | `http://localhost:5173/?restaurant_id=di-pasquale` |
| Kitchen PIN | `1113` at `/staff/login?restaurant_id=di-pasquale` |
| FOH PIN | `1112` |
| Manager PIN | `1111` |
| Bar PIN | `1114` |
| Owner | `dr.mtorres@icloud.com` / `2026` |

## Collections

Core: `restaurants`, `floor_plans`, `restaurant_tables`, `floor_props`, `staff`, `menu_items`, `orders`, `order_items`, `payments`

Also: inventory, promos, feedback, owner/messaging tables.
