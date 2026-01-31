"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect signed-in users to the worker dashboard
    if (isLoaded && isSignedIn) {
      router.push("/worker");
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading while checking auth or redirecting
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">SafetyFirst</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignedOut>
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center p-8 pt-20">
        <SignedOut>
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Workplace Safety
              <br />
              <span className="text-primary">Made Intelligent</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              AI-powered OH&S compliance and risk management system.
              Predict risks, prevent incidents, protect workers.
            </p>
            <div className="flex gap-4 justify-center">
              <SignInButton>
                <Button size="lg">Get Started</Button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Redirecting to dashboard...</span>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
