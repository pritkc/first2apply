# 🔒 Backup Security Guidelines

This document outlines security best practices for creating and managing backups in the First2Apply project.

## ⚠️ Critical Security Rules

### ❌ NEVER Include in Backups:
- Environment files (`.env*`, `functions.env`)
- API keys and secrets
- Private keys and certificates
- Database credentials
- User authentication tokens
- Payment processing keys
- Any sensitive configuration files

### ✅ Safe to Include in Backups:
- Source code (excluding sensitive configs)
- Database schema and migrations
- Documentation
- Static assets
- Build configurations (without secrets)

## 🛠️ Tools and Scripts

### 1. Secure Backup Script
Use the provided secure backup script to create safe backups:

```bash
./scripts/secure-backup.sh
```

This script automatically:
- Excludes all sensitive files
- Verifies backup security
- Creates a manifest of included files
- Prevents accidental inclusion of environment variables

### 2. Environment Template
Use `scripts/env.template` as a reference for environment variables:

```bash
cp scripts/env.template .env.local
# Edit .env.local with your actual values
```

### 3. Pre-commit Hook
Install the pre-commit hook to prevent accidental commits:

```bash
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 📋 Backup Process

### Creating a Secure Backup:
1. **Use the secure backup script:**
   ```bash
   ./scripts/secure-backup.sh
   ```

2. **Verify the backup:**
   - Check the manifest file
   - Ensure no `.env*` files are included
   - Verify no API keys are present

3. **Test the backup:**
   ```bash
   tar -tzf backups/your_backup.tar.gz | grep -E "\.(env|key|secret)"
   # Should return no results
   ```

### Manual Backup (Not Recommended):
If you must create a manual backup, use these exclusion patterns:

```bash
tar -czf backup.tar.gz \
  --exclude='*.env*' \
  --exclude='**/functions.env' \
  --exclude='**/*.key' \
  --exclude='**/*.secret' \
  --exclude='**/node_modules' \
  --exclude='**/.git' \
  --exclude='**/backups' \
  .
```

## 🔍 Verification Commands

### Check for Environment Files:
```bash
find . -name "*.env*" -o -name "functions.env"
```

### Check for API Keys in Files:
```bash
grep -r "sk-\|AIza\|mlsn\." . --exclude-dir=node_modules --exclude-dir=.git
```

### Verify Backup Security:
```bash
tar -tzf your_backup.tar.gz | grep -E "\.(env|key|secret|pem)$"
```

## 🚨 Incident Response

If sensitive data is accidentally included in a backup:

1. **Immediately delete the backup file**
2. **Regenerate all exposed API keys**
3. **Review and update .gitignore**
4. **Use the secure backup script going forward**
5. **Consider the data compromised and take appropriate security measures**

## 📚 Additional Resources

- [Environment Variables Best Practices](https://12factor.net/config)
- [Git Security Best Practices](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work)
- [API Key Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials)

## 🔄 Regular Maintenance

- Review backup contents monthly
- Update exclusion patterns as needed
- Rotate API keys quarterly
- Test backup restoration process
- Update security documentation

---

**Remember: Security is everyone's responsibility. When in doubt, exclude sensitive data from backups.**
