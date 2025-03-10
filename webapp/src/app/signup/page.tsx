'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { signupWithEmail } from '@/lib/electronMainSdk';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Schema definition for form validation using Zod
const schema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormValues = z.infer<typeof schema>;

/**
 * Component used to render the signup page.
 */
export default function SignupPage() {
  const router = useRouter();
  const { login } = useSession();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignupWithEmail = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      const user = await signupWithEmail({ email, password });
      login(user);
      router.push('/');
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
    disabled: isSubmitting,
  });

  const onSubmit = (values: SignupFormValues) => {
    // Check if email and password are present
    if (values.email && values.password) {
      onSignupWithEmail({ email: values.email, password: values.password });
    }
  };

  return (
    <div className="flex h-[calc(100vh-96px)] w-full items-center justify-center md:pb-14">
      <Card className="w-full max-w-sm space-y-2.5 xxs:min-w-80">
        <CardHeader className="space-y-1 px-0 xxs:px-6">
          <CardTitle className="text-center text-2xl tracking-wide">Sign up</CardTitle>
          <CardDescription className="text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="space-y-2.5 px-0 xxs:px-6">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Password</FormLabel>
                    <FormControl className="flex gap-2">
                      <Input id="password" type="password" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="px-0 pb-[68px] pt-2 xxs:px-6">
              <Button className="w-full" disabled={!form.formState.isValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icons.spinner2 className="mr-1 h-4 w-4 animate-spin" />
                    Signing up
                  </>
                ) : (
                  'Sign up'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
