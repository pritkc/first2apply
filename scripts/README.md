# First2Apply Scripts Organization

This directory contains all scripts and utilities organized by category for better maintainability.

## 📁 Directory Structure

```
scripts/
├── database/           # Database management and SQL scripts
├── testing/           # Test scripts and utilities
├── management/        # Service management and deployment scripts
├── data-protection/   # Data protection and backup scripts
└── README.md         # This file
```

## 🗂️ Categories

### Database Scripts (`database/`)
- **setup-admin-user.sql** - Creates permanent admin user after database reset
- **update-list-jobs-function.sql** - Updates the list_jobs database function

### Testing Scripts (`testing/`)
- **comprehensive-test.js** - Comprehensive test suite for external API migration
- **test-external-apis.js** - Tests external API integration
- **test-supabase-connection.js** - Tests Supabase database connection

### Management Scripts (`management/`)
- **service-manager.sh** - Comprehensive service management script with secure backup functionality
- **reboot-recovery.sh** - System recovery after reboot
- **start-desktop-app.sh** - Starts the desktop application

### Data Protection Scripts (`data-protection/`)
- **data-protection-manager.sh** - Main data protection management script
- **enhance-user-protection.sql** - Enhanced user data protection SQL
- **create-readonly-user.sql** - Creates read-only database user for troubleshooting
- **env.template** - Environment variable template for secure configuration

## 🚀 Usage

### Database Management
```bash
# Apply database changes
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/database/setup-admin-user.sql
```

### Testing
```bash
# Run comprehensive tests
node scripts/testing/comprehensive-test.js

# Test external APIs
node scripts/testing/test-external-apis.js
```

### Service Management
```bash
# Start all services
./scripts/management/service-manager.sh start

# Create secure backup (excludes sensitive files)
./scripts/management/service-manager.sh backup

# List available backups
./scripts/management/service-manager.sh list-backups

# Clean old backups (older than 7 days)
./scripts/management/service-manager.sh clean-backups

# Recover after reboot
./scripts/management/reboot-recovery.sh
```

### Data Protection
```bash
# Manage data protection
./scripts/data-protection/data-protection-manager.sh

# Apply enhanced protection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/data-protection/enhance-user-protection.sql
```

## 📋 Script Dependencies

- **Node.js** - Required for JavaScript test scripts
- **PostgreSQL** - Required for database scripts
- **Bash** - Required for shell scripts
- **Supabase CLI** - Required for database operations

## 🔧 Maintenance

- Keep scripts organized by category
- Update this README when adding new scripts
- Ensure all scripts have proper error handling
- Test scripts before committing changes

## 🛡️ Security Notes

- Database scripts contain sensitive operations
- Always backup data before running database scripts
- Use read-only user for troubleshooting when possible
- Review scripts before execution in production
