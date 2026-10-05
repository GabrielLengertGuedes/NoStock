-- Busca de produto por trecho do nome (produtos e historico de movimentacoes).
--
-- A busca filtra com like '%termo%'. O ix_produtos_busca_nome do schema.sql usa
-- text_pattern_ops, que so atende like 'termo%' (prefixo): com o curinga na
-- frente o banco lia a tabela inteira e rodava unaccent em cada linha.
-- O GIN trigram atende o curinga dos dois lados. Nao e parcial (where ativo)
-- porque o historico de movimentacoes tambem busca produto inativo.
--
-- A expressao tem que ser identica a de server/shared/buscaPorNome.js.
-- Termos com menos de 3 letras nao formam trigrama: ai o planner volta sozinho
-- para a leitura sequencial, que e o mesmo custo de antes.

create extension if not exists pg_trgm with schema extensions;

create index if not exists ix_produtos_busca_nome_trgm
  on public.produtos using gin (public.sem_acento(lower(nome)) extensions.gin_trgm_ops);
