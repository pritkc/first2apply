#!/bin/bash

# Data Protection Manager Script
# This script provides comprehensive data protection management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "${GREEN}🛡️  First2Apply Data Protection Manager${NC}"
echo "================================================"

# Function to check if user deletion is safe
check_user_deletion_safety() {
    local user_id=$1
    echo -e "${YELLOW}🔍 Checking if user $user_id can be safely deleted...${NC}"
    
    local result=$(psql "$DB_URL" -t -c "SELECT public.is_user_deletion_safe('$user_id'::uuid);")
    
    if [[ "$result" == *"t"* ]]; then
        echo -e "${GREEN}✅ User $user_id can be safely deleted (no data found)${NC}"
        return 0
    else
        echo -e "${RED}❌ User $user_id CANNOT be deleted - has data in system${NC}"
        return 1
    fi
}

# Function to show user protection status
show_user_protection_status() {
    local user_id=$1
    echo -e "${YELLOW}📊 User Protection Status for $user_id:${NC}"
    
    psql "$DB_URL" -c "
    SELECT 
        user_id,
        email,
        protection_status,
        job_count,
        link_count,
        note_count,
        review_count,
        advanced_matching_count,
        html_dump_count
    FROM public.user_protection_status 
    WHERE user_id = '$user_id'::uuid;"
}

# Function to anonymize user data
anonymize_user_data() {
    local user_id=$1
    echo -e "${YELLOW}🔒 Anonymizing user data for $user_id...${NC}"
    
    # Check if user has data first
    if ! check_user_deletion_safety "$user_id"; then
        echo -e "${BLUE}📝 Proceeding with data anonymization...${NC}"
        
        local result=$(psql "$DB_URL" -t -c "SELECT public.anonymize_user_data('$user_id'::uuid);")
        echo -e "${GREEN}✅ $result${NC}"
    else
        echo -e "${GREEN}✅ User $user_id has no data to anonymize${NC}"
    fi
}

# Function to activate emergency protection
activate_emergency_protection() {
    echo -e "${RED}🚨 ACTIVATING EMERGENCY PROTECTION${NC}"
    echo -e "${YELLOW}This will protect ALL users and backup ALL data...${NC}"
    
    read -p "Are you sure? Type 'EMERGENCY' to confirm: " confirmation
    if [[ "$confirmation" == "EMERGENCY" ]]; then
        local result=$(psql "$DB_URL" -t -c "SELECT public.emergency_protect_all_users();")
        echo -e "${GREEN}✅ $result${NC}"
    else
        echo -e "${YELLOW}❌ Emergency protection cancelled${NC}"
    fi
}

# Function to show all protected users
show_all_protected_users() {
    echo -e "${YELLOW}👥 All Users Protection Status:${NC}"
    
    psql "$DB_URL" -c "
    SELECT 
        user_id,
        email,
        protection_status,
        job_count + link_count + note_count + review_count + advanced_matching_count + html_dump_count as total_data_records,
        user_created_at
    FROM public.user_protection_status 
    ORDER BY total_data_records DESC, user_created_at DESC;"
}

# Function to backup all data
backup_all_data() {
    echo -e "${YELLOW}💾 Creating comprehensive backup...${NC}"
    
    # Run the existing backup script
    if [[ -f "supabase/data-protection/backup-script.sh" ]]; then
        bash supabase/data-protection/backup-script.sh
    else
        echo -e "${RED}❌ Backup script not found${NC}"
        return 1
    fi
}

# Function to check data protection status
check_data_protection_status() {
    echo -e "${YELLOW}🔍 Checking overall data protection status...${NC}"
    
    psql "$DB_URL" -c "SELECT public.check_data_protection_status();"
}

# Function to list protected data
list_protected_data() {
    echo -e "${YELLOW}📋 Protected Data Summary:${NC}"
    
    psql "$DB_URL" -c "
    SELECT 
        table_name,
        operation,
        record_count,
        earliest_backup,
        latest_backup
    FROM public.protected_data_summary 
    ORDER BY table_name, operation;"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1. Check if user deletion is safe"
    echo "2. Show user protection status"
    echo "3. Anonymize user data (instead of deletion)"
    echo "4. Show all protected users"
    echo "5. Backup all data"
    echo "6. Check data protection status"
    echo "7. List protected data"
    echo "8. Activate emergency protection"
    echo "9. Exit"
    echo ""
}

# Main script logic
if [[ $# -eq 0 ]]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Enter your choice (1-9): " choice
        
        case $choice in
            1)
                read -p "Enter user ID: " user_id
                check_user_deletion_safety "$user_id"
                ;;
            2)
                read -p "Enter user ID: " user_id
                show_user_protection_status "$user_id"
                ;;
            3)
                read -p "Enter user ID to anonymize: " user_id
                anonymize_user_data "$user_id"
                ;;
            4)
                show_all_protected_users
                ;;
            5)
                backup_all_data
                ;;
            6)
                check_data_protection_status
                ;;
            7)
                list_protected_data
                ;;
            8)
                activate_emergency_protection
                ;;
            9)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option${NC}"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
else
    # Command line mode
    case $1 in
        "check-user")
            check_user_deletion_safety "$2"
            ;;
        "show-status")
            show_user_protection_status "$2"
            ;;
        "anonymize")
            anonymize_user_data "$2"
            ;;
        "show-all")
            show_all_protected_users
            ;;
        "backup")
            backup_all_data
            ;;
        "check-status")
            check_data_protection_status
            ;;
        "list-protected")
            list_protected_data
            ;;
        "emergency")
            activate_emergency_protection
            ;;
        *)
            echo "Usage: $0 [check-user|show-status|anonymize|show-all|backup|check-status|list-protected|emergency] [user_id]"
            exit 1
            ;;
    esac
fi
