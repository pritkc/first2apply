-- ============================================================================
-- PERMANENT ADMIN USER SETUP
-- ============================================================================
-- Run this after: supabase db reset
-- This creates the permanent admin user with all required records

-- Create permanent admin user in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'f5ebad5c-0298-4eda-9305-1415809c280f',
    'authenticated',
    'authenticated',
    'dev@localhost.com',
    '$2b$10$2FPjoCBa3Fj3br3oj0g/XOMAgcKET4byT8KUKuVpEVT26Y9XrmSm2', -- password123
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '', -- confirmation_token (must be empty string, not NULL)
    '', -- email_change (must be empty string, not NULL)
    '', -- email_change_token_new (must be empty string, not NULL)
    ''  -- recovery_token (must be empty string, not NULL)
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

-- Create admin identity record (required for Supabase auth)
INSERT INTO auth.identities (
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'f5ebad5c-0298-4eda-9305-1415809c280f',
    'f5ebad5c-0298-4eda-9305-1415809c280f',
    'f5ebad5c-0298-4eda-9305-1415809c280f',
    '{"sub": "f5ebad5c-0298-4eda-9305-1415809c280f", "email": "dev@localhost.com", "email_verified": true, "phone_verified": false}',
    'email',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (
    id,
    created_at,
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_end_date,
    subscription_tier,
    is_trial
) VALUES (
    1,
    NOW(),
    'f5ebad5c-0298-4eda-9305-1415809c280f',
    NULL,
    NULL,
    NOW() + INTERVAL '1 year',
    'premium',
    false
) ON CONFLICT (id) DO UPDATE SET
    subscription_tier = 'premium',
    subscription_end_date = NOW() + INTERVAL '1 year',
    is_trial = false;
