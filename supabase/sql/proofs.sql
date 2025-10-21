-- Supabase migration for proofs table hardening (v18.5).
create table if not exists public.proofs (
  id uuid primary key default uuid_generate_v4(),
  filename text not null,
  version text,
  gate text,
  tenant_id uuid,
  meta_hash text,
  uploaded_at timestamptz default timezone('UTC', now()),
  proof_json jsonb
);

alter table public.proofs
  add column if not exists tenant_id uuid;

-- TODO: backfill tenant_id per tenant prior to enforcing NOT NULL.
alter table public.proofs
  alter column tenant_id set not null;

alter table public.proofs enable row level security;

create policy proofs_tenant_rls
  on public.proofs
  using (tenant_id = auth.uid())
  with check (tenant_id = auth.uid());
