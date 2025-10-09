#!/bin/bash
# Production Data Restore Script
# This script restores the stable backup to production Supabase

set -euo pipefail

echo "🚀 Starting Production Data Restore..."

# Check if production environment file exists
if [ ! -f "prod-env-template.env" ]; then
    echo "❌ Error: prod-env-template.env not found"
    echo "Please create this file with your production credentials first"
    exit 1
fi

# Load production environment
echo "📋 Loading production environment..."
export $(cat prod-env-template.env | grep -v '^#' | grep -v 'YOUR_.*_HERE' | xargs)

# Check required environment variables
if [ -z "${SUPABASE_DB_PASSWORD:-}" ] || [ "$SUPABASE_DB_PASSWORD" = "YOUR_DATABASE_PASSWORD_HERE" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD not set in prod-env-template.env"
    echo "Please update the file with your actual database password"
    exit 1
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "YOUR_ANON_KEY_HERE" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not set in prod-env-template.env"
    echo "Please update the file with your actual anon key"
    exit 1
fi

# Construct database connection string
DB_URL="postgresql://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}?sslmode=require"

echo "🔗 Connecting to production database: ${SUPABASE_DB_HOST}"

# Test connection
echo "🧪 Testing database connection..."
psql "$DB_URL" -c "SELECT 1;" > /dev/null || {
    echo "❌ Failed to connect to production database"
    echo "Please check your credentials in prod-env-template.env"
    exit 1
}
echo "✅ Database connection successful"

# Create backup directory for production restore
PROD_BACKUP_DIR="/tmp/first2apply_prod_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$PROD_BACKUP_DIR"

echo "📦 Preparing restore files..."
cp -r backups/first2apply_backup_20250908_005541/* "$PROD_BACKUP_DIR/"

# Generate production restore SQL
echo "🔧 Generating production restore SQL..."

# 1. Reset sequences and fix constraints
cat > "$PROD_BACKUP_DIR/reset_sequences_prod.sql" << 'EOF'
-- Reset all sequences to max(id)+1 to prevent conflicts
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS sequence_name,
      t.relname AS table_name,
      a.attname AS column_name
    FROM pg_class c
    JOIN pg_depend d ON d.objid = c.oid AND d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 0) + 1, true);',
      rec.sequence_name, rec.column_name, rec.schema_name, rec.table_name
    );
  END LOOP;
END
$$;

-- Fix foreign key constraints for safe link deletion
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS public_jobs_link_id_fkey;
ALTER TABLE public.jobs ALTER COLUMN link_id DROP NOT NULL;
ALTER TABLE public.jobs ADD CONSTRAINT public_jobs_link_id_fkey
  FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE SET NULL;

-- Update job status from processing to new for any stuck jobs
UPDATE public.jobs SET status = 'new' WHERE status = 'processing';

-- Analyze tables for better performance
ANALYZE VERBOSE;
EOF

# 2. Create CSV restore SQL
cat > "$PROD_BACKUP_DIR/restore_csvs_prod.sql" << 'EOF'
-- Restore CSV-backed tables
BEGIN;
SET session_replication_role = replica;

-- Truncate and reload CSV tables
TRUNCATE TABLE
  public.sites,
  public.profiles,
  public.advanced_matching,
  public.jobs,
  public.links,
  public.notes
RESTART IDENTITY CASCADE;

-- Load from CSVs (using absolute paths)
\copy public.sites FROM '/tmp/first2apply_prod_restore_*/sites_backup.csv' WITH (FORMAT csv, HEADER true);
\copy public.profiles FROM '/tmp/first2apply_prod_restore_*/profiles_backup.csv' WITH (FORMAT csv, HEADER true);
\copy public.advanced_matching FROM '/tmp/first2apply_prod_restore_*/advanced_matching_backup.csv' WITH (FORMAT csv, HEADER true);
\copy public.jobs FROM '/tmp/first2apply_prod_restore_*/jobs_backup.csv' WITH (FORMAT csv, HEADER true);
\copy public.links FROM '/tmp/first2apply_prod_restore_*/links_backup.csv' WITH (FORMAT csv, HEADER true);
\copy public.notes FROM '/tmp/first2apply_prod_restore_*/notes_backup.csv' WITH (FORMAT csv, HEADER true);

SET session_replication_role = DEFAULT;
COMMIT;
EOF

# 3. Extract and restore remaining tables from SQL dump
echo "📊 Extracting remaining tables from SQL dump..."
sed -nE "/^COPY (public\.html_dumps|public\.reviews|public\.protected_data|public\.super_protected_profiles)/,/^\\\.$/p" "$PROD_BACKUP_DIR/database_backup.sql" > "$PROD_BACKUP_DIR/remaining_tables.sql"

cat > "$PROD_BACKUP_DIR/restore_remaining_prod.sql" << 'EOF'
-- Restore remaining public tables from SQL dump
BEGIN;
SET session_replication_role = replica;

TRUNCATE TABLE
  public.html_dumps,
  public.reviews,
  public.protected_data,
  public.super_protected_profiles
RESTART IDENTITY CASCADE;

EOF

cat "$PROD_BACKUP_DIR/remaining_tables.sql" >> "$PROD_BACKUP_DIR/restore_remaining_prod.sql"

cat >> "$PROD_BACKUP_DIR/restore_remaining_prod.sql" << 'EOF'

SET session_replication_role = DEFAULT;
COMMIT;
EOF

echo "⚠️  WARNING: This will replace ALL data in your production database!"
echo "📋 Backup being restored: first2apply_backup_20250908_005541"
echo "🗄️  Target database: ${SUPABASE_DB_HOST}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled by user"
    exit 1
fi

echo "🚀 Starting production restore..."

# Step 1: Reset sequences and fix constraints
echo "1️⃣ Resetting sequences and fixing constraints..."
psql "$DB_URL" -f "$PROD_BACKUP_DIR/reset_sequences_prod.sql"

# Step 2: Restore CSV tables
echo "2️⃣ Restoring CSV-backed tables..."
# Update CSV paths in the SQL file
sed -i "s|/tmp/first2apply_prod_restore_\*/|$PROD_BACKUP_DIR/|g" "$PROD_BACKUP_DIR/restore_csvs_prod.sql"
psql "$DB_URL" -f "$PROD_BACKUP_DIR/restore_csvs_prod.sql"

# Step 3: Restore remaining tables
echo "3️⃣ Restoring remaining tables from SQL dump..."
psql "$DB_URL" -f "$PROD_BACKUP_DIR/restore_remaining_prod.sql"

# Step 4: Verify restore
echo "4️⃣ Verifying restore..."
psql "$DB_URL" -c "
SELECT 'sites' AS table, COUNT(*) FROM public.sites
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'advanced_matching', COUNT(*) FROM public.advanced_matching
UNION ALL SELECT 'jobs', COUNT(*) FROM public.jobs
UNION ALL SELECT 'links', COUNT(*) FROM public.links
UNION ALL SELECT 'notes', COUNT(*) FROM public.notes
UNION ALL SELECT 'html_dumps', COUNT(*) FROM public.html_dumps
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL SELECT 'protected_data', COUNT(*) FROM public.protected_data
UNION ALL SELECT 'super_protected_profiles', COUNT(*) FROM public.super_protected_profiles;
"

echo "✅ Production restore completed successfully!"
echo "🧹 Cleaning up temporary files..."
rm -rf "$PROD_BACKUP_DIR"

echo "🎉 Production database has been restored with stable backup data!"
echo "📊 You can now access your production application with the restored data."

