# First2Apply - Job Board Aggregator

First2Apply is a job board aggregator that centralizes listings from LinkedIn, Indeed, Dice, and other platforms. Uses external AI APIs (Google Gemini, OpenAI, Llama) for intelligent job filtering with flexible model selection.

## System Architecture

```
Electron App (Desktop) → Supabase (Port: 54321) → External AI APIs (Gemini/OpenAI/Llama)
```

## System Requirements

- MacBook Pro M1/M2/M3 with 16GB RAM minimum
- 5GB free disk space
- macOS Big Sur or later
- Node.js and Homebrew

## Quick Start

### First Time Setup
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js if needed  
brew install node

# Start all services (installs dependencies automatically)
./service-manager.sh start
```

### Daily Usage
```bash
# After reboot, restore all services
./reboot-recovery.sh

# Or use service manager
./service-manager.sh start
```

### Login Credentials
- Email: `dev@localhost.com` 
- Password: `password123`

## Service Management

### Basic Commands
```bash
./service-manager.sh status      # Check all services
./service-manager.sh start       # Start all services
./service-manager.sh stop        # Stop all services  
./service-manager.sh restart     # Restart all services
./service-manager.sh troubleshoot # Fix white screen issues
./service-manager.sh logs        # View logs
./service-manager.sh cleanup     # Clean up old processes
```

### Service URLs
- Electron App: Desktop application (paper airplane icon in menu bar)
- Supabase Studio: http://localhost:54323
- Supabase API: http://localhost:54321
- External AI APIs: Configured via Electron app UI

## Troubleshooting Guide

### 1. White Screen in Electron App
```bash
./service-manager.sh troubleshoot
```

### 2. Services Not Starting After Reboot
```bash
./reboot-recovery.sh
```

### 3. Port Conflicts
```bash
# Kill processes on specific ports
sudo lsof -ti:54321,54322,54323,3001,11434 | xargs sudo kill -9

# Or use cleanup
./service-manager.sh cleanup
./service-manager.sh start
```

### 4. API Configuration Issues
- Open the Electron app
- Go to Advanced Matching page
- Click "Configure API Keys"
- Enter your API keys for your chosen provider
- Select your preferred AI provider (Gemini recommended)

### 5. Complete System Reset
```bash
./service-manager.sh stop
./service-manager.sh cleanup
./service-manager.sh start
```

## Debugging Instructions

### Check Service Status
```bash
# All services
./service-manager.sh status

# Individual checks
curl -s http://localhost:54321 && echo "✅ Supabase API" || echo "❌ Supabase API"
# External APIs are tested through the Electron app interface
```

### Process Monitoring
```bash
# Check running processes
ps aux | grep -E "(electron|ollama|supabase|node.*local-llm)"

# Check port usage
lsof -i :54321  # Supabase API
lsof -i :3001   # Local LLM API
lsof -i :11434  # Ollama
```

### Log Files
```bash
./service-manager.sh logs electron    # Electron logs
./service-manager.sh logs llm        # LLM API logs
./service-manager.sh logs supabase   # Supabase logs
```

### Environment Check
```bash
echo "USE_LOCAL_LLM: $USE_LOCAL_LLM"
echo "DEFAULT_LLM_PROVIDER: $DEFAULT_LLM_PROVIDER"
```

## Monitoring & Testing

### Usage Statistics
```bash
node monitor-llm-usage.js report    # View usage stats
node monitor-llm-usage.js reset     # Reset stats
```

### Verify No OpenAI Usage
```bash
node verify-no-openai-usage.js      # Comprehensive verification
```

### Test Local LLM
```bash
node test-local-llm.js              # Performance test
node test-supabase-local-llm.js     # Integration test
```

## Performance & Cost

| Metric | OpenAI GPT-4o | Google Gemini 2.5 Flash-Lite | Llama API |
|--------|---------------|-------------------------------|-----------|
| Response Time | ~800ms | ~600ms | ~1000ms |
| Cost per Request | $0.002-0.005 | $0.0001-0.0003 | Variable |
| Monthly Cost (2500 jobs/day) | ~$160 | ~$20 | TBD |
| Rate Limits | Yes | Yes | Variable |
| Data Privacy | Sent to OpenAI | Sent to Google | Variable |

## Manual Service Management

### Ollama
```bash
brew services start ollama
brew services stop ollama
curl http://localhost:11434/api/tags
```

### Local LLM API
```bash
cd local-llm-api
npm start
curl http://localhost:3001/health
```

### Supabase
```bash
npx supabase start
npx supabase stop
npx supabase status
open http://localhost:54323
```

### Electron App
```bash
cd desktopProbe
USE_LOCAL_LLM=true LOCAL_LLM_ENDPOINT=http://localhost:3001 npm start
```

## Directory Structure

```
first2apply/
├── desktopProbe/           # Electron app
├── supabase/               # Database & functions
├── local-llm-api/          # Local LLM server
├── webapp/                 # Web interface
├── service-manager.sh      # Service management
├── reboot-recovery.sh      # System recovery
├── start-local-llm.sh      # LLM setup
├── monitor-llm-usage.js    # Usage tracking
├── verify-no-openai-usage.js # Verification
├── test-local-llm.js       # Performance test
└── test-supabase-local-llm.js # Integration test
```

## Emergency Recovery

### If Nothing Works
```bash
# Nuclear option - complete reset
./service-manager.sh stop
sudo pkill -f electron
sudo pkill -f ollama  
sudo pkill -f supabase
sudo pkill -f "node.*local-llm"
sudo lsof -ti:54321,54322,54323,3001,11434 | xargs sudo kill -9
./service-manager.sh start
```

### Reinstall Dependencies
```bash
# Main project
rm -rf node_modules package-lock.json && npm install

# Desktop app
cd desktopProbe && rm -rf node_modules package-lock.json && npm install && cd ..

# LLM API
cd local-llm-api && rm -rf node_modules package-lock.json && npm install && cd ..
```

## Key Features

- Automated job scanning from multiple job boards
- AI-powered job matching using external APIs (Gemini, OpenAI, Llama)
- Desktop notifications for relevant matches
- Local data storage with Supabase
- Customizable filters and preferences
- Flexible AI provider selection with cost optimization
- Drag-and-drop model selection interface
- Secure API key management

## Service Dependencies

1. Supabase runs independently for data storage
2. Electron App depends on Supabase
3. External AI APIs are accessed directly from Supabase functions

## Script Functionality

- `service-manager.sh`: Comprehensive service management with troubleshooting
- `reboot-recovery.sh`: Complete system recovery after reboot

## API Configuration

Configure your AI provider through the Electron app:
1. Open the app and go to "Advanced Matching"
2. Click "Configure API Keys"
3. Enter your API keys for your chosen provider
4. Select your preferred provider (Gemini recommended for cost-effectiveness)

### Supported Providers

- **Google Gemini** (Recommended): Best cost-performance balance
- **OpenAI GPT**: Highest accuracy, premium pricing
- **Llama API**: Coming soon - open source flexibility