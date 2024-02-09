import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useSession } from "@/hooks/session";
import { signupWithEmail } from "@/lib/electronMainSdk";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Button } from "@/components/ui/button";
import { useError } from "@/hooks/error";

// Schema definition for form validation using Zod
const schema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignupFormValues = z.infer<typeof schema>;

export function SignupCard() {
  const { handleError } = useError();
  const { login } = useSession();
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: SignupFormValues) => {
    try {
      // Since the form validates email and password, we can assert their presence
      const user = await signupWithEmail(
        values as { email: string; password: string }
      );
      login(user);
      navigate("/");
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <Card className="min-w-80 space-y-2.5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center tracking-wide">
          Sign up
        </CardTitle>
        <CardDescription className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-2.5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
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
          <CardFooter className="pb-[68px] pt-2">
            <Button className="w-full" disabled={!form.formState.isValid}>
              Sign up
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
