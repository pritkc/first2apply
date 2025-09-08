#!/bin/bash

# 🚀 Development Environment Setup Script
# This script sets up a safe development environment for testing new features

set -e  # Exit on any error

echo "🚀 Setting up Development Environment for First2Apply..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    print_error "Please run this script from the first2apply root directory"
    exit 1
fi

print_status "Setting up development environment..."

# 1. Create development branch
print_status "Creating development branch..."
if git branch | grep -q "development"; then
    print_warning "Development branch already exists, switching to it..."
    git checkout development
else
    git checkout -b development
    print_success "Created and switched to development branch"
fi

# 2. Create environment files
print_status "Creating environment configuration files..."

# Create .env.development
cat > .env.development << EOF
# Development Environment Configuration
# Replace these with your development Supabase project details

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key-here

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# API Keys (use development/test keys)
GEMINI_API_KEY=your-dev-gemini-key
OPENAI_API_KEY=your-dev-openai-key
MAILERSEND_API_KEY=your-dev-mailersend-key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
EOF

# Create .env.production (backup current production settings)
if [ ! -f ".env.production" ]; then
    print_status "Creating production environment backup..."
    cat > .env.production << EOF
# Production Environment Configuration
# DO NOT MODIFY - This is your production configuration

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key-here

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# API Keys (production keys)
GEMINI_API_KEY=your-prod-gemini-key
OPENAI_API_KEY=your-prod-openai-key
MAILERSEND_API_KEY=your-prod-mailersend-key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
EOF
    print_warning "Please update .env.production with your actual production values"
fi

# 3. Create webapp development environment
print_status "Setting up webapp development environment..."
cd webapp

# Create webapp .env.local.dev
cat > .env.local.dev << EOF
# Webapp Development Environment
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key-here
NEXT_PUBLIC_APP_ENV=development
EOF

# Create webapp .env.local.prod
cat > .env.local.prod << EOF
# Webapp Production Environment
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key-here
NEXT_PUBLIC_APP_ENV=production
EOF

cd ..

# 4. Create Supabase development configuration
print_status "Setting up Supabase development configuration..."
cp supabase/config.toml supabase/config.dev.toml

# Update development config
sed -i.bak 's/project_id = "first2apply"/project_id = "first2apply-dev"/' supabase/config.dev.toml
sed -i.bak 's/port = 54321/port = 54331/' supabase/config.dev.toml
sed -i.bak 's/port = 54322/port = 54332/' supabase/config.dev.toml
sed -i.bak 's/port = 54323/port = 54333/' supabase/config.dev.toml

# 5. Create development scripts
print_status "Creating development scripts..."

# Create start-dev script
cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
# Start development environment

echo "🚀 Starting Development Environment..."

# Load development environment
export $(cat .env.development | grep -v '^#' | xargs)

# Start Supabase local development
echo "Starting Supabase local development..."
supabase start --config supabase/config.dev.toml

# Start webapp in development mode
echo "Starting webapp in development mode..."
cd webapp
cp .env.local.dev .env.local
npm run dev
EOF

chmod +x scripts/start-dev.sh

# Create start-prod script
cat > scripts/start-prod.sh << 'EOF'
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
EOF

chmod +x scripts/start-prod.sh

# 6. Update package.json with development scripts
print_status "Adding development scripts to package.json..."

# Create a temporary package.json with new scripts
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  'dev:setup': './scripts/setup-dev-environment.sh',
  'dev:start': './scripts/start-dev.sh',
  'prod:start': './scripts/start-prod.sh',
  'dev:webapp': 'cd webapp && cp .env.local.dev .env.local && npm run dev',
  'prod:webapp': 'cd webapp && cp .env.local.prod .env.local && npm run dev',
  'dev:supabase': 'supabase start --config supabase/config.dev.toml',
  'prod:supabase': 'supabase start'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# 7. Create .gitignore entries for environment files
print_status "Updating .gitignore for environment files..."
if ! grep -q "# Environment files" .gitignore; then
    cat >> .gitignore << 'EOF'

# Environment files
.env.development
.env.production
webapp/.env.local.dev
webapp/.env.local.prod
supabase/config.dev.toml.bak
EOF
fi

# 8. Create development documentation
print_status "Creating development documentation..."
cat > DEVELOPMENT_GUIDE.md << 'EOF'
# 🚀 Development Guide

## Quick Start

### Development Environment
```bash
# Setup (run once)
npm run dev:setup

# Start development environment
npm run dev:start

# Or start components separately
npm run dev:supabase    # Start Supabase locally
npm run dev:webapp      # Start webapp in dev mode
```

### Production Environment
```bash
# Start production environment
npm run prod:start

# Or start components separately
npm run prod:supabase   # Start Supabase locally
npm run prod:webapp     # Start webapp in prod mode
```

## Environment Files

- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- `webapp/.env.local.dev` - Webapp development config
- `webapp/.env.local.prod` - Webapp production config

## Important Notes

1. **Never commit environment files** with real API keys
2. **Always test in development** before production
3. **Use separate Supabase projects** for dev/prod
4. **Keep production backups** before major changes

## Troubleshooting

- If Supabase ports conflict, check `supabase/config.dev.toml`
- If webapp won't start, check environment variables
- If database issues, restart Supabase: `supabase stop && supabase start`
EOF

print_success "Development environment setup complete!"
print_warning "IMPORTANT: Please update the following files with your actual values:"
print_warning "  - .env.development"
print_warning "  - .env.production" 
print_warning "  - webapp/.env.local.dev"
print_warning "  - webapp/.env.local.prod"

print_status "Next steps:"
print_status "1. Create a new Supabase project for development"
print_status "2. Update environment files with your project details"
print_status "3. Run 'npm run dev:start' to start development"
print_status "4. Create feature branches for your new features"

print_success "🎉 Setup complete! You can now safely develop new features!"
