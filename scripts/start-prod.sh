#!/bin/bash
# Start production environment

echo "🚀 Starting Production Environment..."

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

# Start Supabase local development
echo "Starting Supabase local development..."
supabase start

# Start webapp in production mode
echo "Starting webapp in production mode..."
cd webapp
cp .env.local.prod .env.local
npm run dev
