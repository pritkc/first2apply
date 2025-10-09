#!/bin/bash
# Start development environment

echo "🚀 Starting Development Environment..."

# Load development environment
export $(cat .env.development | grep -v '^#' | xargs)

# Start Supabase local development (dev workdir)
echo "Starting Supabase local development (dev workdir)..."
supabase start --workdir ./dev-workdir --yes

# Start webapp in development mode
echo "Starting webapp in development mode..."
cd webapp
cp .env.local.dev .env.local
npm run dev
