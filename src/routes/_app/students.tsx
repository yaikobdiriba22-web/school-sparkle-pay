import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Coming in the next phase.</p>
      </div>
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-4">
            <Construction className="h-6 w-6" />
          </div>
          <p className="font-medium">Module placeholder</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            The database schema is ready. CRUD UI for {title.toLowerCase()} will be built in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/_app/students")({
  component: () => <ComingSoon title="Students" />,
});
