import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  CalendarCheck,
  ClipboardList,
  FileText,
  Receipt,
  Wallet,
  School,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { title: "Students", url: "/students", icon: GraduationCap },
      { title: "Classes", url: "/classes", icon: Users },
      { title: "Teachers", url: "/teachers", icon: UserCog },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Attendance", url: "/attendance", icon: CalendarCheck },
      { title: "Exams", url: "/exams", icon: ClipboardList },
      { title: "Grades", url: "/grades", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Fee Structures", url: "/fees", icon: Wallet },
      { title: "Invoices", url: "/invoices", icon: Receipt },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <School className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">SchoolHub</span>
              <span className="text-xs text-sidebar-foreground/60">Management Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link
                          to={item.url}
                          className={cn(
                            "flex items-center gap-2",
                            active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
