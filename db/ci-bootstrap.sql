-- Só para o banco efêmero do CI.
--
-- O db/schema.sql foi escrito contra o Supabase e conta com duas coisas que
-- um PostgreSQL puro não traz de fábrica:
--   · o schema `extensions`, onde o unaccent é instalado (schema.sql linhas 7 e 17);
--   · os papéis `anon` e `authenticated`, do PostgREST, alvo do revoke da linha 209.
--
-- Criar os dois aqui permite aplicar o schema.sql sem alterá-lo — ele continua
-- sendo o retrato fiel do banco de produção.

create schema if not exists extensions;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
end $$;
