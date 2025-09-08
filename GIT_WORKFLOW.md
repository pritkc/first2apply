# 🌿 Git Workflow Strategy for Safe Development

## Branch Structure

```
main (production)
├── development (integration)
│   ├── feature/major-changes
│   ├── feature/new-ui
│   ├── feature/database-updates
│   └── feature/api-improvements
└── hotfix/critical-fixes
```

## 🎯 Branch Purposes

### `main` (Production)
- **Purpose**: Stable, production-ready code
- **Protection**: Only merge from `development` after thorough testing
- **Deployment**: Automatically deploys to production
- **Rules**: 
  - No direct commits
  - Only merge from `development`
  - Requires pull request approval

### `development` (Integration)
- **Purpose**: Integration branch for testing features together
- **Protection**: Merge from feature branches
- **Deployment**: Deploys to staging/development environment
- **Rules**:
  - Merge feature branches here first
  - Test integration before merging to main
  - Can have direct commits for integration fixes

### `feature/*` (Feature Development)
- **Purpose**: Individual feature development
- **Protection**: Merge to `development` when ready
- **Deployment**: Local development only
- **Rules**:
  - One feature per branch
  - Descriptive branch names
  - Regular commits with clear messages

## 🚀 Workflow Commands

### Starting New Feature
```bash
# Switch to development branch
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/your-feature-name

# Start development environment
npm run dev:start
```

### Daily Development
```bash
# Work on your feature
# Make commits regularly
git add .
git commit -m "feat: add new feature component"

# Push to remote
git push origin feature/your-feature-name
```

### Merging Feature
```bash
# Switch to development
git checkout development
git pull origin development

# Merge feature
git merge feature/your-feature-name

# Push to development
git push origin development

# Delete feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### Deploying to Production
```bash
# Switch to main
git checkout main
git pull origin main

# Merge from development
git merge development

# Push to production
git push origin main

# Tag release
git tag -a v1.13.0 -m "Release version 1.13.0"
git push origin v1.13.0
```

## 📋 Commit Message Convention

### Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat(webapp): add new job filtering component"
git commit -m "fix(database): resolve migration issue with profiles table"
git commit -m "docs(api): update authentication documentation"
git commit -m "refactor(supabase): optimize database queries"
```

## 🛡️ Safety Measures

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Branch Protection Rules
1. **main branch**:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Restrict pushes to main

2. **development branch**:
   - Require pull request reviews for major changes
   - Allow direct pushes for minor fixes

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests pass (if applicable)
- [ ] No console.log statements in production code
- [ ] Environment variables are properly configured
- [ ] Database migrations are safe and tested
- [ ] API changes are backward compatible
- [ ] Documentation is updated

## 🔄 Environment-Specific Workflows

### Development Environment
```bash
# Start development
npm run dev:start

# Work on feature
git checkout feature/your-feature
# ... make changes ...

# Test locally
npm run dev:webapp
npm run dev:supabase

# Commit and push
git add .
git commit -m "feat: implement new feature"
git push origin feature/your-feature
```

### Production Environment
```bash
# Only after thorough testing in development
git checkout main
git pull origin main
git merge development

# Deploy to production
npm run prod:start
```

## 🚨 Emergency Procedures

### Rollback Production
```bash
# Find the last good commit
git log --oneline

# Reset to last good commit
git reset --hard <commit-hash>

# Force push (be careful!)
git push origin main --force
```

### Hotfix Process
```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# Make minimal fix
# ... make changes ...

# Commit and merge
git add .
git commit -m "fix: critical security issue"
git checkout main
git merge hotfix/critical-fix
git push origin main

# Also merge to development
git checkout development
git merge hotfix/critical-fix
git push origin development
```

## 📊 Monitoring and Tracking

### Branch Status
```bash
# Check branch status
git status
git branch -a

# Check for uncommitted changes
git diff --name-only

# Check commit history
git log --oneline -10
```

### Merge Conflicts
```bash
# Check for conflicts
git merge development

# If conflicts occur
git status
# Edit conflicted files
git add .
git commit -m "resolve merge conflicts"
```

## 🎯 Best Practices

1. **Small, frequent commits** - easier to track and rollback
2. **Descriptive commit messages** - helps with debugging
3. **Regular pushes** - don't lose work
4. **Test before merging** - catch issues early
5. **Use feature flags** - gradual rollouts
6. **Keep branches up to date** - avoid merge conflicts
7. **Document breaking changes** - help team understand
8. **Backup before major changes** - safety net

## 🔧 Useful Git Aliases

```bash
# Add to ~/.gitconfig
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
    lg = log --oneline --graph --decorate --all
    cleanup = "!git branch --merged | grep -v '\\*\\|main\\|development' | xargs -n 1 git branch -d"
```

This workflow ensures safe development while maintaining your production environment's stability.
