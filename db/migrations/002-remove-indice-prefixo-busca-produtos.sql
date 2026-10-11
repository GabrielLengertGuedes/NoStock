-- Remove o indice de busca por prefixo, substituido pelo trigram da 001.
--
-- O ix_produtos_busca_nome (text_pattern_ops) so atende like 'termo%'. Desde a
-- 001 a busca usa like '%termo%', que ele nao atende: o planner usa o
-- ix_produtos_busca_nome_trgm e este indice so custava escrita em todo insert
-- e update de produto.
--
-- Aplicar a mao no Supabase e avisar no grupo (db/migrations/README.md).

drop index if exists public.ix_produtos_busca_nome;
