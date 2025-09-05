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
