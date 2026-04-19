import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  School,
  GraduationCap,
  Users,
  Wallet,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SchoolHub — Modern School Management & Billing" },
      {
        name: "description",
        content:
          "All-in-one school management: students, classes, attendance, grades, and billing with online payments.",
      },
      { property: "og:title", content: "SchoolHub — Modern School Management" },
      {
        property: "og:description",
        content: "Run your school with one clean dashboard. Students, attendance, exams, and billing.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: GraduationCap, title: "Students & Classes", desc: "Enroll, organize, and track every student." },
  { icon: Users, title: "Teachers & Attendance", desc: "Daily attendance and staff management." },
  { icon: ClipboardList, title: "Exams & Grades", desc: "Tests, assignments, midterms, and finals." },
  { icon: Wallet, title: "Billing & Payments", desc: "Invoices, manual records, and online payments." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="h-5 w-5" />
            </div>
            <span className="font-semibold">SchoolHub</span>
          </div>
          <Button asChild>
            <Link to="/login">
              Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-6">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Built for K–12 schools
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Run your entire school from{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            one dashboard
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          SchoolHub brings students, classes, attendance, exams, grades, and billing into a single
          modern platform — with manual and online payment tracking built in.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link to="/login">
              Get started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SchoolHub. Built with Lovable.
        </div>
      </footer>
    </div>
  );
}
