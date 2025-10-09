# First2Apply

Aggregates jobs from multiple sites, with Supabase for data and optional AI providers.

## Canonical commands

```bash
# First-time developer setup
npm run dev:setup

# Start development (local Supabase via dev workdir)
npm run dev:start

# Start production-like mode (cloud Supabase)
npm run prod:start

# Individually
npm run dev:supabase   # Start local Supabase
npm run dev:webapp     # Start webapp in dev mode
```

## Environments

- Development: local Supabase using `dev-workdir` as configured by `scripts/start-dev.sh`.
- Production-like: cloud Supabase; no local DB changes. Be cautious; this uses real data.

Service URLs:
- Supabase Studio: http://127.0.0.1:54323 (development)
- Supabase API: http://127.0.0.1:54321 (development)

## Applications

```bash
# Webapp
cd webapp && npm run dev

# Desktop app
cd desktopProbe && npm start
```

## Environment files

Use the templates in `env-templates/`:

```bash
# Webapp
cp env-templates/webapp-dev.env webapp/.env.local   # development
cp env-templates/webapp-prod.env webapp/.env.local  # production-like

# DesktopProbe
cp env-templates/desktopProbe-dev.env desktopProbe/.env
cp env-templates/desktopProbe-prod.env desktopProbe/.env
```

## Database safety

- Do not modify anything under `supabase/` without understanding migrations and RLS.
- Backups are stored under `backups/`. Do not delete backup tarballs or SQL dumps.
- Development uses isolated local containers; production-like uses Supabase Cloud.

## Troubleshooting

```bash
# Check Supabase status (development)
supabase status

# Common port checks
lsof -i :54321
lsof -i :54322
lsof -i :54323
```

If the webapp fails to start:
```bash
cd webapp
rm -rf node_modules package-lock.json
npm install
```

If local Supabase misbehaves:
```bash
supabase stop
supabase start --workdir ./dev-workdir --yes
```

## Notes

- Preferred entrypoints are the npm scripts defined in `package.json`.
- Legacy `run-dev.sh`/`run-prod.sh` have been archived in `backups/retention/`.
- `First2Apply-master-legacy/` is retained untouched.