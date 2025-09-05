# First2Apply Data Backup Manifest

**Backup Created:** Mon Sep  1 00:41:04 PDT 2025
**Backup ID:** first2apply_backup_20250901_004103

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
2. Run: `./recover_data.sh`
3. Verify data restoration

## Important Notes
- This backup contains all critical application data
- Store this backup in a safe location
- Test recovery in a test environment first
- Keep multiple backup versions

## Data Protection Status
✅ Sites:     16
✅ Jobs:   1494
✅ Links:      2
✅ Advanced Matching:      1
✅ Notes:      1
✅ Profiles:      1
