#!/bin/bash
# Setup Production Schema and Restore Data
# This script creates the schema first, then restores data

set -euo pipefail

echo "🚀 Setting up Production Schema and Restoring Data..."

# Production project details
PROJECT_REF="cmuhafxeywwuoygctwuc"
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.cmuhafxeywwuoygctwuc"
DB_PASSWORD="IWUFe428qeeQuoep"

# Construct database connection string
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo "🔗 Testing connection to production database..."

# Test connection
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Failed to connect to production database"
    exit 1
fi

echo "✅ Database connection successful!"

# Backup directory
BACKUP_DIR="backups/first2apply_backup_20250908_005541"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "⚠️  WARNING: This will create the schema and replace ALL data in your production database!"
echo "📋 Backup being restored: first2apply_backup_20250908_005541"
echo "🗄️  Target database: $PROJECT_REF"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Setup cancelled by user"
    exit 1
fi

echo "🚀 Starting production setup..."

# Step 1: Create schema from local database
echo "1️⃣ Creating database schema from local database..."

# Export schema from local database
echo "   Exporting schema from local database..."
pg_dump 'postgres://supabase_admin:postgres@127.0.0.1:54322/postgres?sslmode=disable' \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  --no-security-labels \
  --no-comments \
  --exclude-schema=information_schema \
  --exclude-schema=pg_catalog \
  --exclude-schema=pg_toast \
  --exclude-schema=pg_temp_1 \
  --exclude-schema=pg_toast_temp_1 \
  --exclude-schema=pg_statistic \
  --exclude-schema=pg_* \
  > /tmp/production_schema.sql

# Clean up the schema file
echo "   Cleaning up schema file..."
sed -i '/^--/d' /tmp/production_schema.sql
sed -i '/^$/d' /tmp/production_schema.sql
sed -i '/^SET /d' /tmp/production_schema.sql
sed -i '/^SELECT /d' /tmp/production_schema.sql

# Apply schema to production
echo "   Applying schema to production database..."
psql "$DB_URL" -f /tmp/production_schema.sql

# Step 2: Reset sequences and fix constraints
echo "2️⃣ Resetting sequences and fixing constraints..."
psql "$DB_URL" -c "
-- Reset all sequences to max(id)+1 to prevent conflicts
DO \$\$
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
\$\$;

-- Fix foreign key constraints for safe link deletion
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS public_jobs_link_id_fkey;
ALTER TABLE public.jobs ALTER COLUMN link_id DROP NOT NULL;
ALTER TABLE public.jobs ADD CONSTRAINT public_jobs_link_id_fkey
  FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE SET NULL;
"

# Step 3: Restore CSV tables
echo "3️⃣ Restoring CSV-backed tables..."
psql "$DB_URL" -c "
BEGIN;
SET session_replication_role = replica;
TRUNCATE TABLE
  public.sites,
  public.profiles,
  public.advanced_matching,
  public.jobs,
  public.links,
  public.notes
RESTART IDENTITY CASCADE;
"

# Load CSVs
echo "   Loading sites..."
psql "$DB_URL" -c "\copy public.sites FROM '$BACKUP_DIR/sites_backup.csv' WITH (FORMAT csv, HEADER true);"

echo "   Loading profiles..."
psql "$DB_URL" -c "\copy public.profiles FROM '$BACKUP_DIR/profiles_backup.csv' WITH (FORMAT csv, HEADER true);"

echo "   Loading advanced_matching..."
psql "$DB_URL" -c "\copy public.advanced_matching FROM '$BACKUP_DIR/advanced_matching_backup.csv' WITH (FORMAT csv, HEADER true);"

echo "   Loading jobs..."
psql "$DB_URL" -c "\copy public.jobs FROM '$BACKUP_DIR/jobs_backup.csv' WITH (FORMAT csv, HEADER true);"

echo "   Loading links..."
psql "$DB_URL" -c "\copy public.links FROM '$BACKUP_DIR/links_backup.csv' WITH (FORMAT csv, HEADER true);"

echo "   Loading notes..."
psql "$DB_URL" -c "\copy public.notes FROM '$BACKUP_DIR/notes_backup.csv' WITH (FORMAT csv, HEADER true);"

psql "$DB_URL" -c "
SET session_replication_role = DEFAULT;
COMMIT;
"

# Step 4: Restore remaining tables from SQL dump
echo "4️⃣ Restoring remaining tables from SQL dump..."
psql "$DB_URL" -c "
BEGIN;
SET session_replication_role = replica;
TRUNCATE TABLE
  public.html_dumps,
  public.reviews,
  public.protected_data,
  public.super_protected_profiles
RESTART IDENTITY CASCADE;
"

# Extract and load remaining tables
echo "   Loading remaining tables from SQL dump..."
sed -nE "/^COPY (public\.html_dumps|public\.reviews|public\.protected_data|public\.super_protected_profiles)/,/^\\\.$/p" "$BACKUP_DIR/database_backup.sql" | psql "$DB_URL"

psql "$DB_URL" -c "
SET session_replication_role = DEFAULT;
COMMIT;
"

# Step 5: Update job status and analyze
echo "5️⃣ Finalizing restore..."
psql "$DB_URL" -c "
UPDATE public.jobs SET status = 'new' WHERE status = 'processing';
ANALYZE VERBOSE;
"

# Step 6: Verify restore
echo "6️⃣ Verifying restore..."
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

# Cleanup
rm -f /tmp/production_schema.sql

echo "✅ Production setup completed successfully!"
echo "🎉 Production database has been created and restored with stable backup data!"
echo "📊 You can now access your production application with the restored data."
echo ""
echo "🔗 Production URLs:"
echo "   - API URL: https://cmuhafxeywwuoygctwuc.supabase.co"
echo "   - Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"










