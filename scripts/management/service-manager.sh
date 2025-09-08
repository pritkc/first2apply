#!/bin/bash

# First2Apply Service Manager
# Comprehensive script to manage all services and troubleshoot issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/pritchakalasiya/Development/first2apply"

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

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=${3:-""}
    
    if [ -n "$port" ]; then
        # Special handling for PostgreSQL database port
        if [ "$port" = "54322" ] && [ "$service_name" = "Supabase DB" ]; then
            # Check if PostgreSQL is listening on the port
            if nc -z localhost "$port" 2>/dev/null; then
                print_success "$service_name is running on port $port"
                return 0
            else
                print_error "$service_name is NOT running on port $port"
                return 1
            fi
        else
            # Regular HTTP check for other services
            if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
                print_success "$service_name is running on port $port"
                return 0
            else
                print_error "$service_name is NOT running on port $port"
                return 1
            fi
        fi
    else
        print_warning "Cannot check $service_name - no port specified"
        return 1
    fi
}

# Function to kill process by port
kill_by_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
        print_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to kill process by name
kill_by_name() {
    local name=$1
    local pids=$(pgrep -f "$name" 2>/dev/null || echo "")
    if [ -n "$pids" ]; then
        print_warning "Killing processes matching '$name'"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to stop all services
stop_all_services() {
    print_status "🛑 Stopping all First2Apply services..."
    
    # Stop Electron app
    print_status "Stopping Electron app..."
    kill_by_name "electron"
    kill_by_name "First 2 Apply"
    
    # Stop Supabase
    print_status "Stopping Supabase..."
    cd "$PROJECT_ROOT"
    npx supabase stop 2>/dev/null || true
    
    # Stop Local LLM API
    print_status "Stopping Local LLM API..."
    kill_by_port 3001
    kill_by_name "local-llm-api"
    
    # Stop Ollama
    print_status "Stopping Ollama..."
    brew services stop ollama 2>/dev/null || true
    kill_by_name "ollama"
    
    # Kill any remaining processes on common ports
    for port in 54321 54322 54323 54324 3001 11434; do
        kill_by_port $port
    done
    
    print_success "All services stopped!"
}

# Local LLM functions removed - now using external APIs

# Function to start Supabase
start_supabase() {
    print_status "🗄️ Starting Supabase..."
    
    cd "$PROJECT_ROOT"
    
    # Check if already running
    if check_service "Supabase API" 54321; then
        return 0
    fi
    
    # Start Supabase
    npx supabase start
    
    # Verify services
    check_service "Supabase API" 54321
    check_service "Supabase DB" 54322
    check_service "Supabase Studio" 54323
}

# Function to start Electron app
start_electron() {
    print_status "🖥️ Starting Electron app..."
    
    cd "$PROJECT_ROOT/desktopProbe"
    
    # Set environment variables for external APIs
    export USE_LOCAL_LLM=false
    export DEFAULT_LLM_PROVIDER=gemini
    
    # Create .env.local file
    echo "USE_LOCAL_LLM=false" > "$PROJECT_ROOT/.env.local"
    echo "DEFAULT_LLM_PROVIDER=gemini" >> "$PROJECT_ROOT/.env.local"
    
    # Start Electron app and wait for build to complete
    print_status "Building and launching Electron app (this may take 30-60 seconds)..."
    
    # Run npm start and capture the output to monitor build progress
    npm start > "$PROJECT_ROOT/electron-build.log" 2>&1 &
    local electron_pid=$!
    echo $electron_pid > "$PROJECT_ROOT/electron.pid"
    
    # Wait for the build to complete by monitoring the log
    local max_wait=120  # Maximum wait time in seconds
    local waited=0
    local build_complete=false
    
    while [ $waited -lt $max_wait ]; do
        if grep -q "Electron app launched successfully\|App ready\|Window created" "$PROJECT_ROOT/electron-build.log" 2>/dev/null; then
            build_complete=true
            break
        fi
        
        # Check if the process is still running
        if ! kill -0 $electron_pid 2>/dev/null; then
            print_error "Electron build process failed!"
            print_status "Check the build log: $PROJECT_ROOT/electron-build.log"
            return 1
        fi
        
        # Check for common build completion indicators
        if grep -q "webpack compiled successfully\|Compiled successfully\|Build completed" "$PROJECT_ROOT/electron-build.log" 2>/dev/null; then
            # Wait a bit more for the app to actually launch
            sleep 5
            build_complete=true
            break
        fi
        
        sleep 2
        waited=$((waited + 2))
        print_status "Waiting for build to complete... (${waited}s/${max_wait}s)"
    done
    
    if [ "$build_complete" = true ]; then
        print_success "Electron app built and started successfully! (PID: $electron_pid)"
        print_status "Build log: $PROJECT_ROOT/electron-build.log"
    else
        print_warning "Build may still be in progress. Check the log: $PROJECT_ROOT/electron-build.log"
        print_status "You can monitor progress with: tail -f $PROJECT_ROOT/electron-build.log"
    fi
}

# Function to start all services
start_all_services() {
    print_status "🚀 Starting all First2Apply services..."
    
    # Start in correct order (removed local LLM dependencies)
    start_supabase
    start_electron
    
    print_success "🎉 All services started successfully!"
    print_status "📊 Service URLs:"
    echo "  • Electron App: Running in desktop"
    echo "  • Supabase Studio: http://localhost:54323"
    echo "  • Supabase API: http://localhost:54321"
    echo "  • External API: Configured via UI (Gemini/OpenAI/Llama)"
}

# Function to restart all services
restart_all_services() {
    print_status "🔄 Restarting all services..."
    stop_all_services
    sleep 3
    start_all_services
}

# Function to check status of all services
check_all_services() {
    print_status "📊 Checking status of all services..."
    
    echo ""
    check_service "Ollama" 11434 "/api/tags"
    check_service "Local LLM API" 3001 "/health"
    check_service "Supabase API" 54321
    check_service "Supabase DB" 54322
    check_service "Supabase Studio" 54323
    
    # Check Electron process
    if pgrep -f "electron" > /dev/null || pgrep -f "First 2 Apply" > /dev/null; then
        print_success "Electron app is running"
    else
        print_error "Electron app is NOT running"
    fi
    
    echo ""
    print_status "Service URLs:"
    echo "  • Supabase Studio: http://localhost:54323"
    echo "  • Supabase API: http://localhost:54321"
    echo "  • Local LLM API: http://localhost:3001/health"
    echo "  • Ollama: http://localhost:11434/api/tags"
}

# Function to troubleshoot Electron white screen
troubleshoot_electron() {
    print_status "🔍 Troubleshooting Electron white screen issue..."
    
    # Check if Electron is running
    if ! pgrep -f "electron" > /dev/null && ! pgrep -f "First 2 Apply" > /dev/null; then
        print_error "Electron app is not running!"
        print_status "Starting Electron app..."
        start_electron
        return
    fi
    
    print_status "Electron app is running. Checking dependencies..."
    
    # Check backend services
    local services_ok=true
    
    if ! check_service "Supabase API" 54321; then
        services_ok=false
        print_status "Starting Supabase..."
        start_supabase
    fi
    
    # Local LLM check removed - now using external APIs
    print_status "External APIs configured via Electron app UI"
    
    if [ "$services_ok" = false ]; then
        print_status "Backend services were down. Restarting Electron app..."
        kill_by_name "electron"
        kill_by_name "First 2 Apply"
        sleep 3
        start_electron
    else
        print_status "All backend services are running. Restarting Electron app..."
        kill_by_name "electron"
        kill_by_name "First 2 Apply"
        sleep 3
        start_electron
    fi
    
    print_success "Troubleshooting complete!"
}

# Function to clean up old processes and files
cleanup() {
    print_status "🧹 Cleaning up old processes and files..."
    
    # Remove PID files
    rm -f "$PROJECT_ROOT/electron.pid"
    rm -f "$PROJECT_ROOT/local-llm-api/llm-api.pid"
    
    # Clean up log files
    rm -f "$PROJECT_ROOT/local-llm-api/llm-api.log"
    
    # Kill any zombie processes
    kill_by_name "node.*local-llm-api"
    kill_by_name "electron.*desktopProbe"
    
    print_success "Cleanup complete!"
}

# Function to show logs
show_logs() {
    local service=${1:-"all"}
    
    case $service in
        "electron")
            print_status "Electron app logs:"
            if [ -f "$PROJECT_ROOT/electron.log" ]; then
                tail -f "$PROJECT_ROOT/electron.log"
            else
                print_warning "No Electron logs found"
            fi
            ;;
        "llm")
            print_status "Local LLM API logs:"
            if [ -f "$PROJECT_ROOT/local-llm-api/llm-api.log" ]; then
                tail -f "$PROJECT_ROOT/local-llm-api/llm-api.log"
            else
                print_warning "No LLM API logs found"
            fi
            ;;
        "supabase")
            print_status "Supabase logs:"
            cd "$PROJECT_ROOT"
            npx supabase logs
            ;;
        *)
            print_status "Available log options: electron, llm, supabase"
            ;;
    esac
}

# Main script logic
case "${1:-}" in
    "start")
        start_all_services
        ;;
    "stop")
        stop_all_services
        ;;
    "restart")
        restart_all_services
        ;;
    "status"|"check")
        check_all_services
        ;;
    "troubleshoot")
        troubleshoot_electron
        ;;
    "cleanup")
        cleanup
        ;;
    "logs")
        show_logs "${2:-all}"
        ;;
    "help"|"--help"|"-h")
        echo "First2Apply Service Manager"
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  start        Start all services"
        echo "  stop         Stop all services"
        echo "  restart      Restart all services"
        echo "  status       Check status of all services"
        echo "  troubleshoot Fix Electron white screen issues"
        echo "  cleanup      Clean up old processes and files"
        echo "  logs [type]  Show logs (electron|llm|supabase|all)"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start                    # Start all services"
        echo "  $0 troubleshoot            # Fix white screen"
        echo "  $0 logs electron           # Show Electron logs"
        echo ""
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
