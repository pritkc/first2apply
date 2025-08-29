#!/bin/bash

# First2Apply Data Protection Manager
# This script manages all aspects of data protection and recovery

set -e

# Configuration
BACKUP_DIR="./backups"
PROTECTION_DIR="./supabase/data-protection"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    echo -e "${BLUE}🛡️  First2Apply Data Protection Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  backup          Create a comprehensive backup of all data"
    echo "  restore         Restore data from a specific backup"
    echo "  status          Show data protection status"
    echo "  protect         Enable database-level data protection"
    echo "  unprotect       Disable database-level data protection"
    echo "  list-backups    List all available backups"
    echo "  verify          Verify backup integrity"
    echo "  auto-backup     Enable automatic backup before commits"
    echo "  test-recovery   Test recovery process in test environment"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup                    # Create backup"
    echo "  $0 restore 20240828_143022   # Restore from specific backup"
    echo "  $0 status                    # Check protection status"
    echo "  $0 protect                   # Enable database protection"
}

# Function to check if Supabase is running
check_supabase() {
    if ! pg_isready -h 127.0.0.1 -p 54322 -U postgres >/dev/null 2>&1; then
        echo -e "${RED}❌ Supabase is not running. Please start it first.${NC}"
        echo "Run: supabase start"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    echo -e "${GREEN}🛡️  Creating comprehensive backup...${NC}"
    
    if [ ! -f "${PROTECTION_DIR}/backup-script.sh" ]; then
        echo -e "${RED}❌ Backup script not found. Please run setup first.${NC}"
        exit 1
    fi
    
    chmod +x "${PROTECTION_DIR}/backup-script.sh"
    "${PROTECTION_DIR}/backup-script.sh"
    
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
}

# Function to list backups
list_backups() {
    echo -e "${BLUE}📦 Available Backups:${NC}"
    
    if [ ! -d "${BACKUP_DIR}" ]; then
        echo -e "${YELLOW}No backups directory found.${NC}"
        return
    fi
    
    cd "${BACKUP_DIR}"
    
    if [ -z "$(ls -A *.tar.gz 2>/dev/null)" ]; then
        echo -e "${YELLOW}No backups found.${NC}"
        return
    fi
    
    echo -e "${GREEN}Backup ID\t\t\tCreated\t\t\tSize\t\tStatus${NC}"
    echo "--------------------------------------------------------------------------------"
    
    for backup in *.tar.gz; do
        backup_id="${backup%.tar.gz}"
        created=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2)
        size=$(du -h "$backup" | cut -f1)
        
        # Check if backup is complete
        if tar -tzf "$backup" | grep -q "BACKUP_MANIFEST.md"; then
            status="✅ Complete"
        else
            status="⚠️  Incomplete"
        fi
        
        echo -e "${backup_id}\t${created}\t${size}\t${status}"
    done
}

# Function to restore backup
restore_backup() {
    local backup_id="$1"
    
    if [ -z "$backup_id" ]; then
        echo -e "${RED}❌ Please specify a backup ID to restore.${NC}"
        echo "Usage: $0 restore BACKUP_ID"
        echo "Run '$0 list-backups' to see available backups."
        exit 1
    fi
    
    local backup_file="${BACKUP_DIR}/${backup_id}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup not found: ${backup_id}${NC}"
        echo "Run '$0 list-backups' to see available backups."
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite current data!${NC}"
    echo -e "${YELLOW}Are you sure you want to restore from backup: ${backup_id}?${NC}"
    read -p "Type 'YES' to confirm: " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        echo -e "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}🔄 Restoring from backup: ${backup_id}${NC}"
    
    # Extract backup
    cd "${BACKUP_DIR}"
    tar -xzf "${backup_id}.tar.gz"
    
    if [ ! -d "$backup_id" ]; then
        echo -e "${RED}❌ Failed to extract backup.${NC}"
        exit 1
    fi
    
    # Run recovery script
    cd "$backup_id"
    if [ -f "recover_data.sh" ]; then
        chmod +x "recover_data.sh"
        ./recover_data.sh
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Data restored successfully!${NC}"
        else
            echo -e "${RED}❌ Data restoration failed.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Recovery script not found in backup.${NC}"
        exit 1
    fi
    
    # Cleanup
    cd ..
    rm -rf "$backup_id"
    
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
}

# Function to enable database protection
enable_protection() {
    echo -e "${GREEN}🔒 Enabling database-level data protection...${NC}"
    
    check_supabase
    
    if [ ! -f "${PROTECTION_DIR}/data-protection.sql" ]; then
        echo -e "${RED}❌ Data protection SQL file not found.${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Applying data protection triggers and functions...${NC}"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f "${PROTECTION_DIR}/data-protection.sql"
    
    echo -e "${GREEN}✅ Database protection enabled successfully!${NC}"
    echo -e "${GREEN}🔄 Checking protection status...${NC}"
    
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT * FROM check_data_protection_status();"
}

# Function to disable database protection
disable_protection() {
    echo -e "${YELLOW}⚠️  Disabling database-level data protection...${NC}"
    
    check_supabase
    
    echo -e "${YELLOW}This will remove all protection triggers. Are you sure? (type 'YES')${NC}"
    read -p "Confirmation: " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        echo -e "${YELLOW}Protection disable cancelled.${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}Removing protection triggers...${NC}"
    
    # Drop all protection triggers
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres << 'EOF'
    DROP TRIGGER IF EXISTS protect_sites_delete ON public.sites;
    DROP TRIGGER IF EXISTS protect_sites_update ON public.sites;
    DROP TRIGGER IF EXISTS protect_jobs_delete ON public.jobs;
    DROP TRIGGER IF EXISTS protect_jobs_update ON public.jobs;
    DROP TRIGGER IF EXISTS protect_advanced_matching_delete ON public.advanced_matching;
    DROP TRIGGER IF EXISTS protect_advanced_matching_update ON public.advanced_matching;
    DROP TRIGGER IF EXISTS protect_links_delete ON public.links;
    DROP TRIGGER IF EXISTS protect_links_update ON public.links;
    DROP TRIGGER IF EXISTS protect_notes_delete ON public.notes;
    DROP TRIGGER IF EXISTS protect_notes_update ON public.notes;
    
    DROP TABLE IF EXISTS public.protected_data CASCADE;
    DROP VIEW IF EXISTS public.protected_data_summary CASCADE;
    
    DROP FUNCTION IF EXISTS backup_before_delete() CASCADE;
    DROP FUNCTION IF EXISTS backup_before_update() CASCADE;
    DROP FUNCTION IF EXISTS restore_protected_data(text, bigint, text) CASCADE;
    DROP FUNCTION IF EXISTS list_protected_data() CASCADE;
    DROP FUNCTION IF EXISTS force_full_backup() CASCADE;
    DROP FUNCTION IF EXISTS check_data_protection_status() CASCADE;
EOF
    
    echo -e "${GREEN}✅ Database protection disabled successfully!${NC}"
}

# Function to show protection status
show_status() {
    echo -e "${BLUE}📊 Data Protection Status:${NC}"
    
    check_supabase
    
    # Check if protection is enabled
    if psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'protected_data';" | grep -q 1; then
        echo -e "${GREEN}✅ Database protection: ENABLED${NC}"
        echo ""
        echo -e "${BLUE}Protection Summary:${NC}"
        psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT * FROM check_data_protection_status();"
        
        echo ""
        echo -e "${BLUE}Recent Protected Operations:${NC}"
        psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT table_name, operation, COUNT(*) as count, MAX(created_at) as latest FROM public.protected_data GROUP BY table_name, operation ORDER BY latest DESC LIMIT 10;"
    else
        echo -e "${RED}❌ Database protection: DISABLED${NC}"
        echo -e "${YELLOW}Run '$0 protect' to enable database-level protection.${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Backup Status:${NC}"
    if [ -d "${BACKUP_DIR}" ] && [ -n "$(ls -A "${BACKUP_DIR}"/*.tar.gz 2>/dev/null)" ]; then
        backup_count=$(ls -1 "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | wc -l)
        latest_backup=$(ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -1 | xargs basename -s .tar.gz)
        echo -e "${GREEN}✅ Backups: ${backup_count} available${NC}"
        echo -e "${GREEN}📅 Latest: ${latest_backup}${NC}"
    else
        echo -e "${RED}❌ No backups found${NC}"
        echo -e "${YELLOW}Run '$0 backup' to create your first backup.${NC}"
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_id="$1"
    
    if [ -z "$backup_id" ]; then
        echo -e "${RED}❌ Please specify a backup ID to verify.${NC}"
        echo "Usage: $0 verify BACKUP_ID"
        exit 1
    fi
    
    local backup_file="${BACKUP_DIR}/${backup_id}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup not found: ${backup_id}${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Verifying backup integrity: ${backup_id}${NC}"
    
    # Extract backup temporarily
    cd "${BACKUP_DIR}"
    tar -xzf "${backup_id}.tar.gz"
    
    if [ ! -d "$backup_id" ]; then
        echo -e "${RED}❌ Failed to extract backup for verification.${NC}"
        exit 1
    fi
    
    cd "$backup_id"
    
    # Check required files
    required_files=("database_backup.sql" "sites_backup.csv" "BACKUP_MANIFEST.md")
    missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        echo -e "${RED}❌ Backup verification failed! Missing files:${NC}"
        printf '%s\n' "${missing_files[@]}"
        cd ..
        rm -rf "$backup_id"
        exit 1
    fi
    
    # Verify checksums if available
    if [ -f "checksums.sha256" ]; then
        echo -e "${YELLOW}Verifying file checksums...${NC}"
        if sha256sum -c checksums.sha256; then
            echo -e "${GREEN}✅ Checksum verification passed${NC}"
        else
            echo -e "${RED}❌ Checksum verification failed${NC}"
            cd ..
            rm -rf "$backup_id"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  No checksums found - skipping integrity check${NC}"
    fi
    
    # Check database backup size
    db_size=$(wc -l < "database_backup.sql")
    if [ "$db_size" -lt 100 ]; then
        echo -e "${RED}❌ Database backup appears too small (${db_size} lines)${NC}"
        cd ..
        rm -rf "$backup_id"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backup verification completed successfully!${NC}"
    echo -e "${GREEN}📊 Database backup: ${db_size} lines${NC}"
    
    # Cleanup
    cd ..
    rm -rf "$backup_id"
}

# Function to enable auto-backup
enable_auto_backup() {
    echo -e "${GREEN}🤖 Enabling automatic backup before commits...${NC}"
    
    # Make git hook executable
    if [ -f ".git/hooks/pre-commit" ]; then
        chmod +x ".git/hooks/pre-commit"
        echo -e "${GREEN}✅ Git pre-commit hook enabled${NC}"
    else
        echo -e "${RED}❌ Git pre-commit hook not found${NC}"
        echo -e "${YELLOW}Make sure you're in a git repository.${NC}"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "${BACKUP_DIR}"
    
    echo -e "${GREEN}✅ Automatic backup enabled!${NC}"
    echo -e "${YELLOW}A backup will be created before every git commit.${NC}"
}

# Function to test recovery
test_recovery() {
    echo -e "${BLUE}🧪 Testing recovery process...${NC}"
    
    # Create a test backup
    echo -e "${YELLOW}Creating test backup...${NC}"
    create_backup
    
    # Get the latest backup
    latest_backup=$(ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -1 | xargs basename -s .tar.gz)
    
    if [ -z "$latest_backup" ]; then
        echo -e "${RED}❌ No backup found for testing${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Test backup created: ${latest_backup}${NC}"
    echo -e "${YELLOW}You can now test recovery with: $0 restore ${latest_backup}${NC}"
    echo -e "${YELLOW}⚠️  This will overwrite current data!${NC}"
}

# Main script logic
case "${1:-help}" in
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "status")
        show_status
        ;;
    "protect")
        enable_protection
        ;;
    "unprotect")
        disable_protection
        ;;
    "list-backups")
        list_backups
        ;;
    "verify")
        verify_backup "$2"
        ;;
    "auto-backup")
        enable_auto_backup
        ;;
    "test-recovery")
        test_recovery
        ;;
    "help"|*)
        show_help
        ;;
esac
