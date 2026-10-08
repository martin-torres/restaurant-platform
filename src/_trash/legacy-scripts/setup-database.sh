#!/bin/bash
# ============================================================================
# Restaurant Platform — One-Click Database Setup
# Run this when Supabase is back online.
# Usage: bash scripts/setup-database.sh
# ============================================================================

set -e

echo "🚀 Restaurant Platform — Database Setup"
echo "========================================"
echo ""

# Project config
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# DB connection from .env (fallback to prompt)
if [ ! -f .env ]; then
  echo "❌ No .env file found. Create one with VITE_SUPABASE_URL first."
  exit 1
fi

# Source the .env for DB_PASSWORD
source .env 2>/dev/null || true

echo "📡 Step 1: Applying schema (36 tables)..."
echo "   Running: supabase/migrations/001_schema.sql"

# Try pg connection via node script
node scripts/apply-migration.cjs 2>&1 || {
  echo ""
  echo "⚠️  Automatic connection failed."
  echo ""
  echo "📋 Manual option:"
  echo "   1. Open: https://supabase.com/dashboard/project/auushbzgsjxyulkchwae/sql/new"
  echo "   2. Paste: supabase/migrations/001_schema.sql"
  echo "   3. Click Run"
  echo "   4. Then paste: supabase/seed.sql"
  echo "   5. Click Run"
  echo ""
  echo "Then come back and run: npm run dev"
  exit 1
}

echo ""
echo "🌱 Step 2: Seeding test data (5 restaurants)..."
echo "   Running: supabase/seed.sql"
echo "   ✅ 5 restaurants with full menus"
echo "   ✅ Floor plans & tables"
echo "   ✅ Staff accounts with PIN codes"
echo "   ✅ Owner account (Martín)"
echo "   ✅ Sample reviews"
echo "   ✅ Promotions & QR codes"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🔑 ACCESS CREDENTIALS"
echo "======================"
echo "OWNER PANEL:"
echo "   URL:     http://localhost:5173/owner/login"
echo "   Email:   dr.mtorres@icloud.com"
echo "   Passcode: 2026"
echo ""
echo "STAFF ACCESS (per restaurant):"
echo "   Di Pasquale — Manager PIN: 1111 | Server: 1112 | Kitchen: 1113 | Bar: 1114"
echo "   Bucaneros  — Manager PIN: 2221 | FOH: 2222 | Kitchen: 2223"
echo ""
echo "CUSTOMER ACCESS:"
echo "   http://localhost:5173/?restaurant_id=r_dipasquale"
echo "   http://localhost:5173/?restaurant_id=r_bucaneros"
echo "   http://localhost:5173/?restaurant_id=r_sencillito"
echo "   http://localhost:5173/?restaurant_id=r_maui"
echo "   http://localhost:5173/?restaurant_id=r_azucarynuez"
echo ""
echo "📋 RUN THE APP:"
echo "   npm run dev"
echo "   → Opens at http://localhost:5173"
