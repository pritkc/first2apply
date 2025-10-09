#!/bin/bash
# Environment Setup Script
# This script helps you set up environment variables for dev/prod

set -euo pipefail

echo "🔧 Environment Setup Script"
echo "=========================="

# Function to copy env file
copy_env() {
    local source="$1"
    local target="$2"
    local app="$3"
    
    if [ -f "$source" ]; then
        cp "$source" "$target"
        echo "✅ Copied $source to $target"
    else
        echo "❌ Source file not found: $source"
        return 1
    fi
}

# Function to setup webapp environment
setup_webapp() {
    local mode="$1"
    echo "📱 Setting up Webapp environment ($mode)..."
    
    if [ "$mode" = "prod" ]; then
        copy_env "env-templates/webapp-prod.env" "webapp/.env.local" "webapp"
    elif [ "$mode" = "dev" ]; then
        copy_env "env-templates/webapp-dev.env" "webapp/.env.local" "webapp"
    else
        echo "❌ Invalid mode: $mode (use 'dev' or 'prod')"
        return 1
    fi
}

# Function to setup desktopProbe environment
setup_desktopProbe() {
    local mode="$1"
    echo "🖥️  Setting up DesktopProbe environment ($mode)..."
    
    if [ "$mode" = "prod" ]; then
        copy_env "env-templates/desktopProbe-prod.env" "desktopProbe/.env" "desktopProbe"
    elif [ "$mode" = "dev" ]; then
        copy_env "env-templates/desktopProbe-dev.env" "desktopProbe/.env" "desktopProbe"
    else
        echo "❌ Invalid mode: $mode (use 'dev' or 'prod')"
        return 1
    fi
}

# Main script
if [ $# -eq 0 ]; then
    echo "Usage: $0 <mode> [app]"
    echo ""
    echo "Modes:"
    echo "  dev  - Use local development database"
    echo "  prod - Use production database"
    echo ""
    echo "Apps (optional):"
    echo "  webapp       - Only setup webapp"
    echo "  desktopProbe - Only setup desktopProbe"
    echo "  all          - Setup both apps (default)"
    echo ""
    echo "Examples:"
    echo "  $0 dev                    # Setup both apps for development"
    echo "  $0 prod webapp           # Setup only webapp for production"
    echo "  $0 dev desktopProbe      # Setup only desktopProbe for development"
    exit 1
fi

MODE="$1"
APP="${2:-all}"

echo "Setting up environment for: $MODE mode"
echo ""

# Validate mode
if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    echo "❌ Invalid mode: $MODE (use 'dev' or 'prod')"
    exit 1
fi

# Setup based on app selection
case "$APP" in
    "webapp")
        setup_webapp "$MODE"
        ;;
    "desktopProbe")
        setup_desktopProbe "$MODE"
        ;;
    "all")
        setup_webapp "$MODE"
        setup_desktopProbe "$MODE"
        ;;
    *)
        echo "❌ Invalid app: $APP (use 'webapp', 'desktopProbe', or 'all')"
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your local Supabase (for dev mode): supabase start"
echo "2. Run your application: npm run dev (webapp) or npm start (desktopProbe)"










