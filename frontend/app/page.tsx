import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-foreground">Welcome</h1>
      </main>
    </div>
  );
}
