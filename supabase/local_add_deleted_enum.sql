do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'Job Status'
      and e.enumlabel = 'deleted'
  ) then
    alter type public."Job Status" add value 'deleted';
  end if;
end $$;


