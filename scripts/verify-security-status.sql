-- Security Status Verification Script
-- This script checks the current security status after applying fixes

-- ==============================================
-- 1. Check RLS Status for All Public Tables
-- ==============================================

SELECT 
    'RLS Status Check' as check_type,
    schemaname as schema_name,
    tablename as table_name,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as rls_status,
    CASE 
        WHEN rowsecurity THEN '✅ SECURE' 
        ELSE '❌ VULNERABLE' 
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ==============================================
-- 2. Check for Views with SECURITY DEFINER
-- ==============================================

SELECT 
    'SECURITY DEFINER Check' as check_type,
    schemaname as schema_name,
    viewname as view_name,
    CASE 
        WHEN definition ILIKE '%SECURITY DEFINER%' THEN 'HAS SECURITY DEFINER' 
        ELSE 'NO SECURITY DEFINER' 
    END as security_definer_status,
    CASE 
        WHEN definition ILIKE '%SECURITY DEFINER%' THEN '⚠️  REVIEW NEEDED' 
        ELSE '✅ SECURE' 
    END as security_status
FROM pg_views 
WHERE schemaname = 'public' 
AND (viewname = 'safe_data_inspection' OR viewname = 'protected_data_summary')
ORDER BY viewname;

-- ==============================================
-- 3. Check for Auth Users Exposure
-- ==============================================

SELECT 
    'Auth Users Exposure Check' as check_type,
    schemaname as schema_name,
    viewname as view_name,
    CASE 
        WHEN definition ILIKE '%auth.users%' THEN 'EXPOSES AUTH.USERS' 
        ELSE 'NO AUTH.USERS EXPOSURE' 
    END as exposure_status,
    CASE 
        WHEN definition ILIKE '%auth.users%' THEN '❌ VULNERABLE' 
        ELSE '✅ SECURE' 
    END as security_status
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'safe_data_inspection';

-- ==============================================
-- 4. Check RLS Policies
-- ==============================================

SELECT 
    'RLS Policies Check' as check_type,
    schemaname as schema_name,
    tablename as table_name,
    policyname as policy_name,
    permissive as policy_type,
    roles as allowed_roles,
    cmd as command_type,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND (tablename = 'super_protected_profiles' OR tablename = 'notes_new')
ORDER BY tablename, policyname;

-- ==============================================
-- 5. Summary Report
-- ==============================================

WITH security_summary AS (
    SELECT 
        'Tables without RLS' as issue_type,
        COUNT(*) as count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND NOT rowsecurity
    
    UNION ALL
    
    SELECT 
        'Views with SECURITY DEFINER' as issue_type,
        COUNT(*) as count
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%SECURITY DEFINER%'
    
    UNION ALL
    
    SELECT 
        'Views exposing auth.users' as issue_type,
        COUNT(*) as count
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%auth.users%'
)
SELECT 
    issue_type,
    count,
    CASE 
        WHEN count = 0 THEN '✅ RESOLVED'
        ELSE '❌ NEEDS ATTENTION'
    END as status
FROM security_summary
ORDER BY issue_type;

-- ==============================================
-- 6. Final Security Assessment
-- ==============================================

DO $$
DECLARE
    tables_without_rls integer;
    views_with_security_definer integer;
    views_exposing_auth_users integer;
    overall_status text;
BEGIN
    -- Count issues
    SELECT COUNT(*) INTO tables_without_rls
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND NOT rowsecurity;
    
    SELECT COUNT(*) INTO views_with_security_definer
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%SECURITY DEFINER%';
    
    SELECT COUNT(*) INTO views_exposing_auth_users
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%auth.users%';
    
    -- Determine overall status
    IF tables_without_rls = 0 AND views_with_security_definer = 0 AND views_exposing_auth_users = 0 THEN
        overall_status := '✅ ALL SECURITY ISSUES RESOLVED';
    ELSE
        overall_status := '❌ SECURITY ISSUES REMAIN';
    END IF;
    
    RAISE NOTICE '=== SECURITY ASSESSMENT SUMMARY ===';
    RAISE NOTICE 'Tables without RLS: %', tables_without_rls;
    RAISE NOTICE 'Views with SECURITY DEFINER: %', views_with_security_definer;
    RAISE NOTICE 'Views exposing auth.users: %', views_exposing_auth_users;
    RAISE NOTICE 'Overall Status: %', overall_status;
END $$;
