-- Fix RLS policy for protected_data table to allow authenticated users to insert
-- This is needed for the backup triggers to work properly when updating/deleting jobs

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
