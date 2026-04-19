import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/classes")({
  component: ClassesPage,
});

interface ClassRow {
  id: string;
  name: string;
  grade_level: number;
  section: string | null;
  academic_year: string;
}

function emptyForm(): Omit<ClassRow, "id"> {
  return { name: "", grade_level: 1, section: "", academic_year: new Date().getFullYear().toString() };
}

function ClassesPage() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, grade_level, section, academic_year")
      .order("grade_level", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as ClassRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(row: ClassRow) {
    setEditing(row);
    setForm({
      name: row.name,
      grade_level: row.grade_level,
      section: row.section ?? "",
      academic_year: row.academic_year,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.academic_year.trim()) {
      toast.error("Name and academic year are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      grade_level: Number(form.grade_level),
      section: form.section?.trim() || null,
      academic_year: form.academic_year.trim(),
    };
    const { error } = editing
      ? await supabase.from("classes").update(payload).eq("id", editing.id)
      : await supabase.from("classes").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Class updated" : "Class created");
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage grade levels, sections, and academic years.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              New class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit class" : "New class"}</DialogTitle>
              <DialogDescription>
                A class represents a grade and section for an academic year.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Grade 5 — Section A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade level</Label>
                  <Input
                    id="grade"
                    type="number"
                    min={1}
                    max={12}
                    value={form.grade_level}
                    onChange={(e) => setForm({ ...form, grade_level: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="A"
                    value={form.section ?? ""}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Academic year</Label>
                <Input
                  id="year"
                  placeholder="2025"
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="font-medium">No classes yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first class to start enrolling students.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Academic year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Grade {row.grade_level}</Badge>
                    </TableCell>
                    <TableCell>{row.section ?? "—"}</TableCell>
                    <TableCell>{row.academic_year}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Students currently in this class will lose their assignment.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(row.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
