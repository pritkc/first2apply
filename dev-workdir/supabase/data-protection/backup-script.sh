#!/bin/bash

# Data Protection and Backup Script
# This script creates comprehensive backups of all critical data
# Run this script before any major changes or deployments

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="first2apply_backup_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛡️  Starting First2Apply Data Protection Backup...${NC}"

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# 1. Database Backup (Full dump)
echo -e "${YELLOW}📊 Creating database backup...${NC}"
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --file="${BACKUP_DIR}/${BACKUP_NAME}/database_backup.sql"

# 2. Sites configuration backup
echo -e "${YELLOW}🌐 Backing up sites configuration...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\COPY (SELECT * FROM public.sites ORDER BY id) TO '${BACKUP_DIR}/${BACKUP_NAME}/sites_backup.csv' WITH (FORMAT csv, HEADER true);"

# 3. Advanced matching configurations backup
echo -e "${YELLOW}🤖 Backing up AI configurations...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\COPY (SELECT * FROM public.advanced_matching ORDER BY id) TO '${BACKUP_DIR}/${BACKUP_NAME}/advanced_matching_backup.csv' WITH (FORMAT csv, HEADER true);"

# 4. Jobs backup
echo -e "${YELLOW}💼 Backing up job applications...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\COPY (SELECT * FROM public.jobs ORDER BY id) TO '${BACKUP_DIR}/${BACKUP_NAME}/jobs_backup.csv' WITH (FORMAT csv, HEADER true);"

# 5. Links backup
echo -e "${YELLOW}🔗 Backing up job search links...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\COPY (SELECT * FROM public.links ORDER BY id) TO '${BACKUP_DIR}/${BACKUP_NAME}/links_backup.csv' WITH (FORMAT csv, HEADER true);"

# 6. Notes backup
echo -e "${YELLOW}📝 Backing up job notes...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\COPY (SELECT * FROM public.notes ORDER BY id) TO '${BACKUP_DIR}/${BACKUP_NAME}/notes_backup.csv' WITH (FORMAT csv, HEADER true);"

# 7. Profiles backup
echo -e "${YELLOW}👤 Backing up user profiles...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\COPY (SELECT * FROM public.profiles ORDER BY id) TO '${BACKUP_DIR}/${BACKUP_NAME}/profiles_backup.csv' WITH (FORMAT csv, HEADER true);"

# 8. Environment files backup
echo -e "${YELLOW}⚙️  Backing up configuration files...${NC}"
cp -r .env* "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true
cp -r webapp/.env* "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true
cp -r landingPage/.env* "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true
cp -r supabase/functions.env "${BACKUP_DIR}/${BACKACKUP_NAME}/" 2>/dev/null || true

# 9. Create recovery script
echo -e "${YELLOW}🔧 Creating recovery script...${NC}"
cat > "${BACKUP_DIR}/${BACKUP_NAME}/recover_data.sh" << 'EOF'
#!/bin/bash

# Data Recovery Script
# This script restores all data from the backup

set -e

echo "🔄 Starting data recovery..."

# Restore database
echo "📊 Restoring database..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f database_backup.sql

# Restore sites
echo "🌐 Restoring sites..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\COPY public.sites FROM 'sites_backup.csv' WITH (FORMAT csv, HEADER true);"

# Restore advanced matching
echo "🤖 Restoring AI configurations..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\COPY public.advanced_matching FROM 'advanced_matching_backup.csv' WITH (FORMAT csv, HEADER true);"

# Restore jobs
echo "💼 Restoring job applications..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\COPY public.jobs FROM 'jobs_backup.csv' WITH (FORMAT csv, HEADER true);"

# Restore links
echo "🔗 Restoring job search links..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\COPY public.links FROM 'links_backup.csv' WITH (FORMAT csv, HEADER true);"

# Restore notes
echo "📝 Restoring job notes..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\COPY public.notes FROM 'notes_backup.csv' WITH (FORMAT csv, HEADER true);"

# Restore profiles
echo "👤 Restoring user profiles..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\COPY public.profiles FROM 'profiles_backup.csv' WITH (FORMAT csv, HEADER true);"

echo "✅ Data recovery completed successfully!"
EOF

chmod +x "${BACKUP_DIR}/${BACKUP_NAME}/recover_data.sh"

# 10. Create backup manifest
echo -e "${YELLOW}📋 Creating backup manifest...${NC}"
cat > "${BACKUP_DIR}/${BACKUP_NAME}/BACKUP_MANIFEST.md" << EOF
# First2Apply Data Backup Manifest

**Backup Created:** $(date)
**Backup ID:** ${BACKUP_NAME}

## Contents
- Database full dump (database_backup.sql)
- Sites configuration (sites_backup.csv)
- Advanced matching configurations (advanced_matching_backup.csv)
- Job applications (jobs_backup.csv)
- Job search links (links_backup.csv)
- Job notes (notes_backup.csv)
- User profiles (profiles_backup.csv)
- Environment configurations
- Recovery script (recover_data.sh)

## Recovery Instructions
1. Navigate to this backup directory
2. Run: \`./recover_data.sh\`
3. Verify data restoration

## Important Notes
- This backup contains all critical application data
- Store this backup in a safe location
- Test recovery in a test environment first
- Keep multiple backup versions

## Data Protection Status
✅ Sites: $(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.sites;")
✅ Jobs: $(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.jobs;")
✅ Links: $(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.links;")
✅ Advanced Matching: $(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.advanced_matching;")
✅ Notes: $(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.notes;")
✅ Profiles: $(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.profiles;")
EOF

# 11. Create checksums for integrity verification
echo -e "${YELLOW}🔍 Creating integrity checksums...${NC}"
cd "${BACKUP_DIR}/${BACKUP_NAME}"
find . -type f -name "*.csv" -o -name "*.sql" | sort | xargs sha256sum > checksums.sha256

# 12. Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
cd ..
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${GREEN}📦 Backup saved as: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}"
echo -e "${GREEN}📋 Manifest: ${BACKUP_DIR}/${BACKUP_NAME}/BACKUP_MANIFEST.md${NC}"
echo -e "${GREEN}🔄 Recovery script: ${BACKUP_DIR}/${BACKUP_NAME}/recover_data.sh${NC}"

# 13. Create backup rotation (keep last 5 backups)
echo -e "${YELLOW}🔄 Rotating old backups (keeping last 5)...${NC}"
cd "${BACKUP_DIR}"
ls -t *.tar.gz | tail -n +6 | xargs -r rm

echo -e "${GREEN}🛡️  Data protection backup completed!${NC}"
