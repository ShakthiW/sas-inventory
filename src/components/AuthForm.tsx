"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SocialProviders from "@/components/SocialProviders";
import { signIn, signUp } from "@/lib/auth/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AuthMode = "sign-in" | "sign-up";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

type Props = { mode?: AuthMode };

function SignInForm() {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const router = useRouter();

  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function onSubmit(values: SignInValues) {
    setFeedback(null);
    const res = await signIn(values);
    setFeedback({
      type: res.ok ? "success" : "error",
      message: res.message,
    });
    if (res.ok) {
      toast.success(res.message);
      router.replace("/dashboard");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={
              feedback.type === "success"
                ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                : "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            }
          >
            {feedback.message}
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 rounded-xl text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="minimum 8 characters"
                  className="h-12 rounded-xl text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-full text-base"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

function SignUpForm() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const router = useRouter();

  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function onSubmit(values: SignUpValues) {
    setFeedback(null);
    const res = await signUp(values);
    setFeedback({
      type: res.ok ? "success" : "error",
      message: res.message,
    });
    if (res.ok) {
      toast.success(res.message);
      router.replace("/dashboard");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={
              feedback.type === "success"
                ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                : "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            }
          >
            {feedback.message}
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  className="h-12 rounded-xl text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 rounded-xl text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="minimum 8 characters"
                  className="h-12 rounded-xl text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-full text-base"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Creating account..."
            : "Create account"}
        </Button>
      </form>
    </Form>
  );
}

export default function AuthForm({ mode = "sign-in" }: Props) {
  const isSignIn = mode === "sign-in";

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <div className="text-center text-sm text-muted-foreground">
          {isSignIn ? (
            <span>
              New here?{" "}
              <a
                className="text-foreground underline-offset-4 hover:underline"
                href="/sign-up"
              >
                Sign Up
              </a>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <a
                className="text-foreground underline-offset-4 hover:underline"
                href="/sign-in"
              >
                Sign In
              </a>
            </span>
          )}
        </div>
        <CardTitle className="text-center text-4xl font-semibold">
          {isSignIn ? "Welcome Back" : "Join Us Today!"}
        </CardTitle>
        <CardDescription className="text-center text-base">
          {isSignIn
            ? "Sign in to continue"
            : "Create your account to Start managing your inventory with ease."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <SocialProviders variant={isSignIn ? "sign-in" : "sign-up"} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {isSignIn ? "Or sign in with" : "Or sign up with"}
              </span>
            </div>
          </div>

          {isSignIn ? <SignInForm /> : <SignUpForm />}
        </div>
      </CardContent>
      <CardFooter className="justify-center text-center text-xs text-muted-foreground">
        {!isSignIn && (
          <p>
            By signing up, you agree to our{" "}
            <a className="underline-offset-4 hover:underline" href="#">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className="underline-offset-4 hover:underline" href="#">
              Privacy Policy
            </a>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
