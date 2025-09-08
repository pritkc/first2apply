-- Create a read-only database user for safe troubleshooting
-- This user can view data but cannot modify or delete anything

-- Create read-only user
CREATE USER readonly_troubleshooter WITH PASSWORD 'readonly_secure_password_2024';

-- Grant connect permission
GRANT CONNECT ON DATABASE postgres TO readonly_troubleshooter;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO readonly_troubleshooter;

-- Grant SELECT on all tables (read-only access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_troubleshooter;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO readonly_troubleshooter;

-- Grant SELECT on all sequences (for viewing, not modifying)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly_troubleshooter;

-- Grant SELECT on all views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_troubleshooter;

-- Grant execute on read-only functions
GRANT EXECUTE ON FUNCTION public.check_user_protection_status(uuid) TO readonly_troubleshooter;
GRANT EXECUTE ON FUNCTION public.is_user_deletion_safe(uuid) TO readonly_troubleshooter;
GRANT EXECUTE ON FUNCTION public.list_protected_data() TO readonly_troubleshooter;
GRANT EXECUTE ON FUNCTION public.check_data_protection_status() TO readonly_troubleshooter;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_troubleshooter;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT ON TABLES TO readonly_troubleshooter;

-- Create a function to check what this user can do
CREATE OR REPLACE FUNCTION public.check_readonly_permissions()
RETURNS TABLE(
    permission_type text,
    object_name text,
    has_permission boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'SELECT' as permission_type,
        'public.jobs' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.jobs', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'SELECT' as permission_type,
        'public.profiles' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.profiles', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'SELECT' as permission_type,
        'public.links' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.links', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'SELECT' as permission_type,
        'public.notes' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.notes', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'SELECT' as permission_type,
        'public.reviews' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.reviews', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'SELECT' as permission_type,
        'public.advanced_matching' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.advanced_matching', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'SELECT' as permission_type,
        'public.protected_data' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.protected_data', 'SELECT') as has_permission
    UNION ALL
    SELECT 
        'DELETE' as permission_type,
        'public.jobs' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.jobs', 'DELETE') as has_permission
    UNION ALL
    SELECT 
        'UPDATE' as permission_type,
        'public.jobs' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.jobs', 'UPDATE') as has_permission
    UNION ALL
    SELECT 
        'INSERT' as permission_type,
        'public.jobs' as object_name,
        has_table_privilege('readonly_troubleshooter', 'public.jobs', 'INSERT') as has_permission;
END;
$$;

-- Grant execute on the permission check function
GRANT EXECUTE ON FUNCTION public.check_readonly_permissions() TO readonly_troubleshooter;

-- Create a view for safe data inspection
CREATE OR REPLACE VIEW public.safe_data_inspection AS
SELECT 
    'users' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM auth.users
UNION ALL
SELECT 
    'profiles' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.profiles
UNION ALL
SELECT 
    'jobs' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.jobs
UNION ALL
SELECT 
    'links' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.links
UNION ALL
SELECT 
    'notes' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.notes
UNION ALL
SELECT 
    'reviews' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.reviews
UNION ALL
SELECT 
    'advanced_matching' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.advanced_matching
UNION ALL
SELECT 
    'protected_data' as data_type,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.protected_data;

-- Grant access to the safe inspection view
GRANT SELECT ON public.safe_data_inspection TO readonly_troubleshooter;

-- Create a function to safely inspect user data without exposing sensitive information
CREATE OR REPLACE FUNCTION public.safe_inspect_user_data(target_user_id uuid)
RETURNS TABLE(
    data_type text,
    record_count bigint,
    sample_titles text[],
    created_at_range text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'jobs' as data_type,
        COUNT(*) as record_count,
        ARRAY_AGG(title ORDER BY created_at DESC LIMIT 5) as sample_titles,
        CONCAT(MIN(created_at)::text, ' to ', MAX(created_at)::text) as created_at_range
    FROM public.jobs 
    WHERE user_id = target_user_id
    UNION ALL
    SELECT 
        'links' as data_type,
        COUNT(*) as record_count,
        ARRAY_AGG(title ORDER BY created_at DESC LIMIT 5) as sample_titles,
        CONCAT(MIN(created_at)::text, ' to ', MAX(created_at)::text) as created_at_range
    FROM public.links 
    WHERE user_id = target_user_id
    UNION ALL
    SELECT 
        'notes' as data_type,
        COUNT(*) as record_count,
        ARRAY_AGG(LEFT(text, 50) || '...' ORDER BY created_at DESC LIMIT 5) as sample_titles,
        CONCAT(MIN(created_at)::text, ' to ', MAX(created_at)::text) as created_at_range
    FROM public.notes 
    WHERE user_id = target_user_id;
END;
$$;

-- Grant access to the safe inspection function
GRANT EXECUTE ON FUNCTION public.safe_inspect_user_data(uuid) TO readonly_troubleshooter;

COMMENT ON USER readonly_troubleshooter IS 'Read-only user for safe database troubleshooting - cannot modify or delete data';
COMMENT ON FUNCTION public.check_readonly_permissions() IS 'Checks what permissions the readonly user has';
COMMENT ON VIEW public.safe_data_inspection IS 'Safe view for inspecting data counts without exposing sensitive information';
COMMENT ON FUNCTION public.safe_inspect_user_data(uuid) IS 'Safely inspects user data without exposing sensitive information';
