'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { sendPasswordResetEmail } from '@/lib/electronMainSdk';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Schema definition for form validation using Zod
const schema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

type ForgotPasswordFormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
    mode: 'onChange',
    disabled: isSubmitting,
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      await sendPasswordResetEmail({ email: values.email });
      toast({
        title: 'Reset password email sent',
        description: `An email has been sent to ${values.email} with a link to reset your password.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-96px)] w-full items-center justify-center md:pb-14">
      <Card className="w-full max-w-sm space-y-2.5 xxs:min-w-80">
        <CardHeader className="space-y-1 px-0 xxs:px-6">
          <CardTitle className="text-center text-2xl tracking-wide">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address, and we’ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="space-y-2.5 px-0 xxs:px-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-0 pb-7 pt-2 xxs:px-6">
              <Button className="w-full" disabled={!form.formState.isValid || isSubmitting}>
                {isSubmitting && <Icons.spinner2 className="mr-1 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <div className="justify-self-end">
                <Link href="/login" className="w-fit text-xs text-muted-foreground hover:underline">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
