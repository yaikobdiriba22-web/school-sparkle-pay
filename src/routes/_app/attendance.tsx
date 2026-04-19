import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Save, Check, X, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
});

type Status = "present" | "absent" | "late" | "excused";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface AttendanceMap {
  [studentId: string]: { id?: string; status: Status; notes?: string };
}

const statusConfig: Record<Status, { label: string; icon: typeof Check; tone: string }> = {
  present: { label: "Present", icon: Check, tone: "bg-success text-success-foreground" },
  absent: { label: "Absent", icon: X, tone: "bg-destructive text-destructive-foreground" },
  late: { label: "Late", icon: Clock, tone: "bg-warning text-warning-foreground" },
  excused: { label: "Excused", icon: Info, tone: "bg-info text-info-foreground" },
};

function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load classes
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("classes").select("id, name").order("grade_level");
      if (error) toast.error(error.message);
      const list = (data ?? []) as ClassOption[];
      setClasses(list);
      if (list.length && !classId) setClassId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load students + existing attendance whenever class/date changes
  useEffect(() => {
    if (!classId) return;
    (async () => {
      setLoading(true);
      const [studentsRes, attRes] = await Promise.all([
        supabase
          .from("students")
          .select("id, first_name, last_name, admission_number")
          .eq("class_id", classId)
          .eq("status", "active")
          .order("first_name"),
        supabase
          .from("attendance")
          .select("id, student_id, status, notes")
          .eq("class_id", classId)
          .eq("date", date),
      ]);
      if (studentsRes.error) toast.error(studentsRes.error.message);
      if (attRes.error) toast.error(attRes.error.message);

      const studentList = (studentsRes.data ?? []) as Student[];
      setStudents(studentList);

      const map: AttendanceMap = {};
      studentList.forEach((s) => {
        map[s.id] = { status: "present" };
      });
      (attRes.data ?? []).forEach((a) => {
        map[a.student_id] = {
          id: a.id,
          status: a.status as Status,
          notes: a.notes ?? undefined,
        };
      });
      setAttendance(map);
      setLoading(false);
    })();
  }, [classId, date]);

  function setStatus(studentId: string, status: Status) {
    setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  }

  function markAll(status: Status) {
    setAttendance((prev) => {
      const next: AttendanceMap = {};
      students.forEach((s) => {
        next[s.id] = { ...prev[s.id], status };
      });
      return next;
    });
  }

  async function saveAll() {
    if (!classId) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const records = students.map((s) => ({
      student_id: s.id,
      class_id: classId,
      date,
      status: attendance[s.id]?.status ?? "present",
      notes: attendance[s.id]?.notes ?? null,
      recorded_by: user?.id ?? null,
    }));
    // upsert by (student_id, date) unique constraint
    const { error } = await supabase
      .from("attendance")
      .upsert(records, { onConflict: "student_id,date" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Attendance saved for ${records.length} student${records.length === 1 ? "" : "s"}`);
  }

  const summary = useMemo(() => {
    const counts: Record<Status, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    students.forEach((s) => {
      const st = attendance[s.id]?.status ?? "present";
      counts[st]++;
    });
    return counts;
  }, [attendance, students]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mark daily attendance for each class.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={saveAll} disabled={saving || !students.length}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? "Saving..." : "Save attendance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="font-medium">No classes available</p>
            <p className="text-sm text-muted-foreground mt-1">Create a class first to mark attendance.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {students.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground mr-2">Quick mark all:</span>
              {(Object.keys(statusConfig) as Status[]).map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => markAll(s)}>
                  {statusConfig[s].label}
                </Button>
              ))}
              <div className="ml-auto flex gap-2 flex-wrap">
                {(Object.keys(statusConfig) as Status[]).map((s) => (
                  <Badge key={s} variant="secondary" className="font-mono">
                    {statusConfig[s].label}: {summary[s]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Loading...</div>
              ) : students.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-3">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <p className="font-medium">No active students in this class</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enroll students and assign them to this class to track attendance.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((s) => {
                    const current = attendance[s.id]?.status ?? "present";
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-4 p-3 md:p-4 hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {s.first_name} {s.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {s.admission_number}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {(Object.keys(statusConfig) as Status[]).map((st) => {
                            const cfg = statusConfig[st];
                            const Icon = cfg.icon;
                            const active = current === st;
                            return (
                              <button
                                key={st}
                                onClick={() => setStatus(s.id, st)}
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all",
                                  active
                                    ? cfg.tone + " border-transparent shadow-sm"
                                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{cfg.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
