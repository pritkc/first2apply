#!/bin/bash

# First2Apply Reboot Recovery Script
# Run this script after system reboot to restore all services

set -e

PROJECT_ROOT="/Users/pritchakalasiya/Development/first2apply"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "🔄 First2Apply System Recovery After Reboot"
print_status "=========================================="

# Step 1: Check system prerequisites
print_status "1️⃣ Checking system prerequisites..."

# Check if Homebrew is available
if ! command -v brew &> /dev/null; then
    print_error "Homebrew is not installed or not in PATH"
    print_status "Please install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi
print_success "Homebrew is available"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    print_status "Please install Node.js: brew install node"
    exit 1
fi
print_success "Node.js is available ($(node --version))"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi
print_success "npm is available ($(npm --version))"

# Step 2: Navigate to project directory
print_status "2️⃣ Navigating to project directory..."
if [ ! -d "$PROJECT_ROOT" ]; then
    print_error "Project directory not found: $PROJECT_ROOT"
    exit 1
fi
cd "$PROJECT_ROOT"
print_success "In project directory: $PROJECT_ROOT"

# Step 3: Install/Update dependencies if needed
print_status "3️⃣ Checking dependencies..."

# Check main project dependencies
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    print_status "Installing main project dependencies..."
    npm install
fi

# Check desktop app dependencies
if [ -f "desktopProbe/package.json" ] && [ ! -d "desktopProbe/node_modules" ]; then
    print_status "Installing desktop app dependencies..."
    cd desktopProbe
    npm install
    cd ..
fi

# Check local LLM API dependencies
if [ -f "local-llm-api/package.json" ] && [ ! -d "local-llm-api/node_modules" ]; then
    print_status "Installing local LLM API dependencies..."
    cd local-llm-api
    npm install
    cd ..
fi

print_success "Dependencies checked"

# Step 4: Check if Ollama is installed
print_status "4️⃣ Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    print_warning "Ollama is not installed"
    print_status "Installing Ollama..."
    brew install ollama
else
    print_success "Ollama is installed"
fi

# Step 5: Check if Supabase CLI is available
print_status "5️⃣ Checking Supabase CLI..."
if ! command -v supabase &> /dev/null && ! npx supabase --version &> /dev/null; then
    print_warning "Supabase CLI not found globally, will use npx"
fi
print_success "Supabase CLI is available"

# Step 6: Clean up any leftover processes
print_status "6️⃣ Cleaning up leftover processes..."
"$PROJECT_ROOT/service-manager.sh" cleanup

# Step 7: Start all services
print_status "7️⃣ Starting all services..."
"$PROJECT_ROOT/service-manager.sh" start

# Step 8: Verify everything is working
print_status "8️⃣ Verifying services..."
sleep 5
"$PROJECT_ROOT/service-manager.sh" status

print_success "🎉 System recovery complete!"
print_status ""
print_status "📋 Quick Commands:"
print_status "  Check status:    ./service-manager.sh status"
print_status "  Restart all:     ./service-manager.sh restart"
print_status "  Stop all:        ./service-manager.sh stop"
print_status "  Troubleshoot:    ./service-manager.sh troubleshoot"
print_status "  Show logs:       ./service-manager.sh logs"
print_status ""
print_status "🌐 Service URLs:"
print_status "  • Supabase Studio: http://localhost:54323"
print_status "  • Supabase API: http://localhost:54321"
print_status "  • Local LLM API: http://localhost:3001/health"
print_status "  • Ollama: http://localhost:11434/api/tags"
