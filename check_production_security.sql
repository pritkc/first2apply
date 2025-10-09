-- Check Production Security Status
-- Run this script in your production Supabase SQL Editor to verify security fixes

-- 1. Check which tables don't have RLS enabled
SELECT 
    'Tables without RLS' as check_type,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- 2. Check for views that might expose auth.users
SELECT 
    'Views exposing auth.users' as check_type,
    schemaname, 
    viewname,
    CASE 
        WHEN definition LIKE '%auth.users%' THEN 'EXPOSES AUTH.USERS'
        ELSE 'SAFE'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. Check view permissions (should not have anon or authenticated access to sensitive views)
SELECT 
    'View permissions' as check_type,
    n.nspname as schema_name, 
    c.relname as view_name, 
    c.relacl,
    CASE 
        WHEN c.relacl::text LIKE '%anon%' OR c.relacl::text LIKE '%authenticated%' THEN 'POTENTIALLY UNSAFE'
        ELSE 'SAFE'
    END as security_status
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace 
WHERE c.relkind = 'v' 
AND n.nspname = 'public'
ORDER BY c.relname;

-- 4. Check for SECURITY DEFINER functions that might be problematic
SELECT 
    'SECURITY DEFINER functions' as check_type,
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true
AND n.nspname = 'public'
ORDER BY p.proname;

-- 5. Summary of security status
SELECT 
    'Security Summary' as check_type,
    'All public tables have RLS' as item,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SECURE'
        ELSE '❌ ' || COUNT(*) || ' tables without RLS'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false

UNION ALL

SELECT 
    'Security Summary' as check_type,
    'Views exposing auth.users' as item,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SECURE'
        ELSE '❌ ' || COUNT(*) || ' views expose auth.users'
    END as status
FROM pg_views 
WHERE schemaname = 'public'
AND definition LIKE '%auth.users%';
