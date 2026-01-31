import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Shield,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Users,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SafetyFirst</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignedIn>
              <Link href="/worker">
                <Button>Go to Dashboard</Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Safety Compliance
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Workplace Safety
            <br />
            <span className="text-primary">Made Intelligent</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A comprehensive OH&S compliance and risk management system for Saskatchewan crown corporations.
            Predict risks, prevent incidents, protect workers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignUpButton>
                <Button size="lg" className="gap-2 text-lg px-8">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/worker">
                <Button size="lg" className="gap-2 text-lg px-8">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">95%</p>
              <p className="text-sm text-muted-foreground mt-1">Risk Prediction Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">Real-time Monitoring</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">60%</p>
              <p className="text-sm text-muted-foreground mt-1">Incident Reduction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete Safety Management</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From daily form submission to AI-powered risk prediction, SafetyFirst covers every aspect of workplace safety.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Daily Safety Forms</h3>
              <p className="text-muted-foreground text-sm">
                Workers submit daily safety assessments including hazard exposure, PPE usage, and physical condition.
              </p>
            </div>

            <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Risk Prediction</h3>
              <p className="text-muted-foreground text-sm">
                Machine learning models analyze patterns to predict and prevent workplace incidents before they occur.
              </p>
            </div>

            <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Dashboards</h3>
              <p className="text-muted-foreground text-sm">
                Role-specific dashboards provide instant visibility into risk levels across teams and departments.
              </p>
            </div>

            <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Automated Alerts</h3>
              <p className="text-muted-foreground text-sm">
                Instant notifications when risk thresholds are exceeded, ensuring rapid response to potential hazards.
              </p>
            </div>

            <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground text-sm">
                Managers can monitor team safety, approve overrides, and track compliance across their workforce.
              </p>
            </div>

            <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Compliance Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Comprehensive reporting and audit trails to meet regulatory requirements and industry standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporations */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-8">Built for Saskatchewan Crown Corporations</h2>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
            <div className="text-xl font-bold">SaskPower</div>
            <div className="text-xl font-bold">SaskEnergy</div>
            <div className="text-xl font-bold">SaskTel</div>
            <div className="text-xl font-bold">SGI</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Workplace Safety?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Join organizations using SafetyFirst to protect their workers and reduce incidents.
          </p>
          <SignedOut>
            <SignUpButton>
              <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/worker">
              <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">SafetyFirst</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SafetyFirst OH&S Compliance System. Built for SaskHack.
          </p>
        </div>
      </footer>
    </div>
  );
}
