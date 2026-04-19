import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Receipt, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    invoicesPending: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [students, teachers, invoices, classes] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "overdue", "partial"]),
        supabase.from("classes").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        invoicesPending: invoices.count ?? 0,
        classes: classes.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Students", value: stats.students, icon: GraduationCap, tone: "text-primary bg-primary/10" },
    { label: "Classes", value: stats.classes, icon: Users, tone: "text-info bg-info/10" },
    { label: "Teachers", value: stats.teachers, icon: Users, tone: "text-success bg-success/10" },
    { label: "Pending Invoices", value: stats.invoicesPending, icon: Receipt, tone: "text-warning bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your school today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{loading ? "—" : c.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}>
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Welcome to SchoolHub 👋</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Phase 1 foundation is ready. The next phases will add:</p>
          <ul className="space-y-1.5 ml-4 list-disc">
            <li>Students, Classes, Teachers CRUD + daily attendance</li>
            <li>Exams (test, assignment, midterm, final) with grades & report cards</li>
            <li>Fee structures, invoices, and manual payment tracking</li>
            <li>Stripe online payments for parents</li>
          </ul>
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-info/10 text-info">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-xs">
              Use the sidebar to navigate. Module pages are placeholders until the next phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
