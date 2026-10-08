# Restaurant Platform

UI-first restaurant ordering & floor-plan management app, now backed by **PocketBase**.

## Surfaces

| Who | Entry | Layout |
|-----|-------|--------|
| Customer | `/?restaurant_id=di-pasquale` | Mobile tabs: Home → Menu → Floor Plan → Cart → Discover |
| Kitchen | `/staff/login` PIN `1113` | 3-column ticket rail (New / In Progress / Ready) |
| Bar | PIN `1114` | Same rail, drinks only |
| FOH / Manager floor | PIN `1112` | **Left sidebar · center floor plan · right tickets** |
| Manager | PIN `1111` | Left nav + floor editor / menu / staff / analytics / inventory |
| Owner | `/owner/login` | Network dashboard |

## Order → Kitchen → Payment (fixed)

1. Customer places order at `/checkout` → status `new`, stations set from menu items  
2. Kitchen/Bar accept → overall status rolls up to `in_progress`  
3. Both stations ready → overall status `ready` (FOH sees red tickets)  
4. FOH pick up → `picking_up` → deliver → `delivered`  
5. Customer `/bill/:id` or FOH Payment panel → **Card / Phone / Cash** → `payment_status: paid`

## Local setup

```bash
npm install

# PocketBase binary (once)
curl -sL https://github.com/pocketbase/pocketbase/releases/download/v0.25.9/pocketbase_0.25.9_linux_amd64.zip -o /tmp/pb.zip
unzip -o /tmp/pb.zip -d pocketbase/
./pocketbase/pocketbase superuser upsert admin@restaurant.local admin123456 --dir=./pocketbase/pb_data

# Terminal A — API
npm run pb:serve
npm run pb:setup

# Terminal B — UI
cp .env.example .env
npm run dev
```

Open http://localhost:5173/?restaurant_id=di-pasquale

See `pocketbase/README.md` for admin/dashboard details.

## Trash

Unused / legacy Supabase·InsForge files live in `src/_trash/` (not imported by the live app).
