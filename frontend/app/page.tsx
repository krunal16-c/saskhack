import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-foreground">My App</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignedIn>
            <UserButton />
          </SignedIn>
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
        <SignedIn>
          <h1 className="text-4xl font-bold text-foreground">Welcome back!</h1>
          <p className="mt-4 text-muted-foreground">You are signed in.</p>
        </SignedIn>
        <SignedOut>
          <h1 className="text-4xl font-bold text-foreground">Welcome</h1>
          <p className="mt-4 text-muted-foreground">Sign in to get started.</p>
        </SignedOut>
      </main>
    </div>
  );
}
