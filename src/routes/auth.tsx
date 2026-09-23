import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { ServeWiseMark } from "@/lib/servewise-navigation";

const searchSchema = z.object({ redirect: z.string().optional() });

function safeRedirect(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && value !== "/auth"
    ? value
    : "/dashboard";
}

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — ServeWise" },
      { name: "description", content: "Sign in to ServeWise kitchen operations." },
      { property: "og:title", content: "Sign in — ServeWise" },
      { property: "og:description", content: "Sign in to ServeWise kitchen operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("not allowed") || m.includes("invalid format"))
    return "This email address can't be used. Please use a real inbox.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("pwned") || m.includes("weak")) return "Please choose a stronger password.";
  if (m.includes("fetch") || m.includes("network")) return "Network problem. Please try again.";
  return "Something went wrong. Please try again.";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const target = safeRedirect(search.redirect);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: target, replace: true });
    });
  }, [navigate, target]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input.");
    setPending(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) return setError(friendlyAuthError(error.message));
        navigate({ to: target, replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) return setError(friendlyAuthError(error.message));
        if (data.session) navigate({ to: target, replace: true });
        else setNotice("Check your email to confirm your account, then sign in.");
      }
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) return setError("Google sign-in failed. Please try again.");
    if (result.redirected) return;
    navigate({ to: target, replace: true });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <ServeWiseMark className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">ServeWise</p>
            <p className="text-xs text-muted-foreground">Meal operations</p>
          </div>
        </div>
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          {mode === "signin" ? "Sign in to your kitchen" : "Create your account"}
        </h1>
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "signin" | "signup");
            setError(null);
            setNotice(null);
          }}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
        </Tabs>
        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-primary">
              {notice}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
