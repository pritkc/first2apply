import { Link, useNavigate } from "react-router-dom";
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
import { useSession } from "@/hooks/session";
import { useState } from "react";
import { loginWithEmail } from "@/lib/electronMainSdk";

export function LoginCard() {
  const { login } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      const user = await loginWithEmail({ email, password });
      login(user);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Card className="min-w-80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-700 hover:underline">
            Sign up
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pb-2">
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
            placeholder="name@example.com"
            value={email}
            onChange={(evt) => setEmail(evt.target.value)}
          />
        </div>
        <div className="grid">
          <Label htmlFor="password" className="mb-2">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(evt) => setPassword(evt.target.value)}
          />
          <div className="justify-self-end">
            <a
              href=""
              className="text-xs underline w-fit text-muted-foreground"
            >
              Forgot passoword?
            </a>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button className="w-full" onClick={onLogin}>
          Log In
        </Button>
      </CardFooter>
    </Card>
  );
}
