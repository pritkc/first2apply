import { LoginCard } from '@/components/loginCard';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { loginWithEmail } from '@/lib/electronMainSdk';
import { ENV } from '@/env';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component used to render the login page.
 */
export function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Auto-login only when using local Supabase (avoid on cloud/prod even if NODE_ENV=development)
  useEffect(() => {
    const attemptAutoLogin = async () => {
      const supabaseUrl = ENV.supabase?.url || '';
      const isLocalSupabase = /^(http:\/\/)?(localhost|127\.0\.0\.1)/i.test(supabaseUrl);
      if (isLocalSupabase && !autoLoginAttempted) {
        setAutoLoginAttempted(true);
        console.log('🔧 Development mode: Attempting auto-login with default credentials');
        
        try {
          setIsSubmitting(true);
          const user = await loginWithEmail({ 
            email: 'dev@localhost.com', 
            password: 'password123' 
          });
          await login(user);
          console.log('✅ Auto-login successful');
          navigate('/');
        } catch (error) {
          console.log('❌ Auto-login failed:', error);
          // Don't show error for auto-login failure, just let user login manually
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    attemptAutoLogin();
  }, [autoLoginAttempted, login, navigate]);

  const onLoginWithEmail = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      const user = await loginWithEmail({ email, password });
      await login(user);
      navigate('/');
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4">
        {ENV.nodeEnv === 'development' && autoLoginAttempted && isSubmitting && (
          <div className="text-center text-sm text-muted-foreground">
            🔧 Development mode: Attempting auto-login with dev@localhost.com...
          </div>
        )}
        <LoginCard onLoginWithEmail={onLoginWithEmail} isSubmitting={isSubmitting} />
      </div>
    </main>
  );
}
