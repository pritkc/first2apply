# ⚡ Quick Start Guide - Safe Development Setup

## 🎯 What This Achieves
- **Complete isolation** from your production environment
- **Safe testing** of major features without risk
- **Easy switching** between development and production
- **Automated setup** with one command

## 🚀 Immediate Setup (5 minutes)

### Step 1: Run the Setup Script
```bash
# Make sure you're in the project root
cd /Users/pritchakalasiya/Development/first2apply

# Run the automated setup
./scripts/setup-dev-environment.sh
```

### Step 2: Create Development Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it: `first2apply-dev` (or similar)
4. Copy the project URL and anon key

### Step 3: Update Environment Files
```bash
# Edit development environment
nano .env.development

# Replace these values:
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key-here
```

### Step 4: Copy Production Schema to Development
```bash
# Export current schema
supabase db dump --data-only > current_data.sql

# Import to development project (via Supabase dashboard SQL editor)
# Or use the Supabase CLI if you have it configured
```

### Step 5: Start Development Environment
```bash
# Start everything in development mode
npm run dev:start

# Or start components separately:
npm run dev:supabase    # Start Supabase locally
npm run dev:webapp      # Start webapp in dev mode
```

## 🎉 You're Ready!

### Your Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-new-feature

# 2. Start development environment
npm run dev:start

# 3. Make your changes
# ... code your features ...

# 4. Test thoroughly
# ... test in development ...

# 5. Commit and push
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/your-new-feature

# 6. When ready, merge to development
git checkout development
git merge feature/your-new-feature
git push origin development
```

## 🔄 Switching Between Environments

### Development Mode
```bash
npm run dev:start
# Uses: .env.development + webapp/.env.local.dev
# Database: Development Supabase project
# Ports: 54331, 54332, 54333 (Supabase), 3000 (webapp)
```

### Production Mode
```bash
npm run prod:start
# Uses: .env.production + webapp/.env.local.prod
# Database: Production Supabase project
# Ports: 54321, 54322, 54323 (Supabase), 3000 (webapp)
```

## 🛡️ Safety Features

### What's Protected
- ✅ **Production database** - completely isolated
- ✅ **Production environment** - separate configuration
- ✅ **Production code** - on main branch only
- ✅ **Production data** - never touched by development

### What You Can Safely Do
- ✅ **Test major features** without risk
- ✅ **Experiment with database changes**
- ✅ **Try new UI components**
- ✅ **Test API modifications**
- ✅ **Break things** in development (it's safe!)

## 📁 File Structure After Setup
```
first2apply/
├── .env.development          # Dev environment variables
├── .env.production           # Prod environment variables
├── webapp/
│   ├── .env.local.dev       # Webapp dev config
│   ├── .env.local.prod      # Webapp prod config
│   └── .env.local           # Active config (auto-switched)
├── supabase/
│   ├── config.toml          # Production Supabase config
│   └── config.dev.toml      # Development Supabase config
├── scripts/
│   ├── setup-dev-environment.sh
│   ├── start-dev.sh
│   └── start-prod.sh
└── DEVELOPMENT_SETUP.md     # Detailed setup guide
```

## 🚨 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Kill processes if needed
kill -9 <PID>
```

**Environment not loading:**
```bash
# Check environment files exist
ls -la .env.development
ls -la webapp/.env.local.dev

# Restart with fresh environment
npm run dev:start
```

**Database connection issues:**
```bash
# Check Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start --config supabase/config.dev.toml
```

**Webapp not starting:**
```bash
# Check environment variables
cat webapp/.env.local

# Reinstall dependencies
cd webapp
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

1. **Test the setup** - make sure everything works
2. **Create your first feature branch** - start developing
3. **Make some test changes** - verify isolation works
4. **Read the full guides** - `DEVELOPMENT_SETUP.md` and `GIT_WORKFLOW.md`

## 📞 Need Help?

- **Setup issues**: Check `DEVELOPMENT_SETUP.md`
- **Git workflow**: Check `GIT_WORKFLOW.md`
- **Environment problems**: Check troubleshooting section above
- **Database issues**: Check Supabase documentation

## 🎉 Success!

You now have a **completely isolated development environment** where you can:
- ✅ Test major features safely
- ✅ Experiment without risk
- ✅ Develop new functionality
- ✅ Keep production stable

**Your production environment is 100% safe!** 🛡️
