import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { signupWithEmail } from "@/lib/electronMainSdk";
import { useState } from "react";
import { useSession } from "@/hooks/session";
import { useNavigate } from "react-router-dom";

export function SignupCard() {
  const { login } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSignup = async () => {
    try {
      const user = await signupWithEmail({ email, password });
      login(user);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Sign up</CardTitle>
        <CardDescription className="text-center">
          select your preferred method to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pb-6">
        <Button variant="outline">
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(evt) => setEmail(evt.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(evt) => setPassword(evt.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button className="w-full" onClick={onSignup}>
          Create account
        </Button>
        <p className="text-xs">
          Already have an account?{" "}
          <Link to="/login" className="text-green-700 hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
