
-- ============ ROLES ============
create type public.app_role as enum ('admin', 'teacher', 'accountant');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Security definer function (avoids recursive RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Trigger to auto-create profile + assign first user as admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
begin
  insert into public.profiles (user_id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.email);

  select count(*) into user_count from auth.users;
  if user_count = 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);
create policy "Admins can view all profiles" on public.profiles
  for select using (public.has_role(auth.uid(), 'admin'));

-- User roles policies
create policy "Users can view own roles" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ CLASSES ============
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level int not null,
  section text,
  academic_year text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.classes enable row level security;
create trigger update_classes_updated_at before update on public.classes
  for each row execute function public.update_updated_at_column();

create policy "Authenticated can view classes" on public.classes
  for select to authenticated using (true);
create policy "Admins manage classes" on public.classes
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ STUDENTS ============
create table public.students (
  id uuid primary key default gen_random_uuid(),
  admission_number text not null unique,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  gender text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  address text,
  class_id uuid references public.classes(id) on delete set null,
  status text not null default 'active',
  enrollment_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.students enable row level security;
create trigger update_students_updated_at before update on public.students
  for each row execute function public.update_updated_at_column();
create index idx_students_class on public.students(class_id);

create policy "Authenticated can view students" on public.students
  for select to authenticated using (true);
create policy "Admins manage students" on public.students
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ TEACHERS ============
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  subject text,
  hire_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teachers enable row level security;
create trigger update_teachers_updated_at before update on public.teachers
  for each row execute function public.update_updated_at_column();

create policy "Authenticated can view teachers" on public.teachers
  for select to authenticated using (true);
create policy "Admins manage teachers" on public.teachers
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ ATTENDANCE ============
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
alter table public.attendance enable row level security;
create index idx_attendance_date on public.attendance(date);
create index idx_attendance_student on public.attendance(student_id);

create policy "Authenticated view attendance" on public.attendance
  for select to authenticated using (true);
create policy "Admins manage attendance" on public.attendance
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ EXAMS ============
create type public.exam_type as enum ('test','assignment','midterm','final');

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_type exam_type not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject text not null,
  exam_date date,
  max_score numeric(6,2) not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.exams enable row level security;
create trigger update_exams_updated_at before update on public.exams
  for each row execute function public.update_updated_at_column();

create policy "Authenticated view exams" on public.exams
  for select to authenticated using (true);
create policy "Admins manage exams" on public.exams
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ GRADES ============
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(6,2) not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, student_id)
);
alter table public.grades enable row level security;
create trigger update_grades_updated_at before update on public.grades
  for each row execute function public.update_updated_at_column();
create index idx_grades_student on public.grades(student_id);

create policy "Authenticated view grades" on public.grades
  for select to authenticated using (true);
create policy "Admins manage grades" on public.grades
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ FEE STRUCTURES ============
create type public.billing_cycle as enum ('monthly','term','annual','one_time');

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_id uuid references public.classes(id) on delete set null,
  amount numeric(12,2) not null,
  cycle billing_cycle not null default 'monthly',
  academic_year text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fee_structures enable row level security;
create trigger update_fee_structures_updated_at before update on public.fee_structures
  for each row execute function public.update_updated_at_column();

create policy "Authenticated view fee structures" on public.fee_structures
  for select to authenticated using (true);
create policy "Admins manage fee structures" on public.fee_structures
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ INVOICES ============
create type public.invoice_status as enum ('pending','paid','partial','overdue','cancelled');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_id uuid references public.fee_structures(id) on delete set null,
  amount numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  due_date date not null,
  status invoice_status not null default 'pending',
  period text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.invoices enable row level security;
create trigger update_invoices_updated_at before update on public.invoices
  for each row execute function public.update_updated_at_column();
create index idx_invoices_student on public.invoices(student_id);
create index idx_invoices_status on public.invoices(status);

create policy "Authenticated view invoices" on public.invoices
  for select to authenticated using (true);
create policy "Admins manage invoices" on public.invoices
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ PAYMENTS ============
create type public.payment_method as enum ('cash','bank_transfer','card','online','cheque');
create type public.payment_status as enum ('pending','completed','failed','refunded');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method payment_method not null,
  reference text,
  status payment_status not null default 'completed',
  paid_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create index idx_payments_invoice on public.payments(invoice_id);

create policy "Authenticated view payments" on public.payments
  for select to authenticated using (true);
create policy "Admins manage payments" on public.payments
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
