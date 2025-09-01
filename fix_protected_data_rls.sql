-- Fix RLS policy for protected_data table
-- Run this in your Supabase SQL editor to fix the archive/delete error

-- Drop existing policy
DROP POLICY IF EXISTS "enable all for service role only" ON public.protected_data;

-- Recreate policy for service role with proper syntax
CREATE POLICY "enable all for service role only" 
ON public.protected_data 
AS permissive 
FOR all 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add policy for authenticated users to insert (needed for backup triggers)
CREATE POLICY "allow authenticated users to insert for backup triggers" 
ON public.protected_data 
AS permissive 
FOR insert 
TO authenticated 
WITH CHECK (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'protected_data';
