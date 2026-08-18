-- NoStock — consultas de referencia
-- Nao e executado em deploy: e o texto canonico das consultas que a API usa.
-- Placeholders no estilo node-postgres.

-- ─────────────────────────────────────────────── movimentacao de estoque

begin;

select quantidade_atual, preco_venda
  from public.produtos
 where id = $1 and ativo
   for update;

-- O service valida o saldo aqui. Insuficiente: rollback e erro SALDO_INSUFICIENTE.

update public.produtos
   set quantidade_atual = $2
 where id = $1;

insert into public.movimentacoes
  (produto_id, usuario_id, tipo, motivo, quantidade,
   saldo_anterior, saldo_posterior, preco_unitario, observacao)
values ($1, $3, $4, $5, $6, $7, $2, $8, $9);

commit;

-- ─────────────────────────────────────────────────── sugestao de compra
-- nulls last empurra o grupo sem fornecedor para o fim.

select f.id   as fornecedor_id,
       f.nome as fornecedor_nome,
       f.contato_nome, f.telefone, f.email,
       p.id, p.nome, p.quantidade_atual, p.estoque_minimo,
       greatest(p.estoque_minimo * 2 - p.quantidade_atual, 1) as quantidade_sugerida
  from public.produtos p
  left join public.fornecedores f on f.id = p.fornecedor_id
 where p.ativo
   and p.estoque_minimo > 0
   and p.quantidade_atual <= p.estoque_minimo
 order by f.nome nulls last, p.quantidade_atual asc;

-- ──────────────────────────────────────────────────── cards do dashboard

select count(*)                                     as total_produtos,
       count(*) filter (where quantidade_atual = 0) as sem_estoque,
       count(*) filter (where quantidade_atual > 0
                          and estoque_minimo > 0
                          and quantidade_atual <= estoque_minimo) as estoque_baixo
  from public.produtos
 where ativo;

-- Inicio e fim do dia local, convertidos para UTC.
select count(*) filter (where tipo = 'ENTRADA') as entradas_hoje,
       count(*) filter (where tipo = 'SAIDA')   as saidas_hoje
  from public.movimentacoes
 where criado_em >= $1 and criado_em < $2;

-- ────────────────────────────────────────────────────────── relatorios
-- Total vendido no periodo, pelo preco registrado na movimentacao.

select sum(quantidade * preco_unitario) as total_vendido,
       sum(quantidade)                  as unidades_vendidas
  from public.movimentacoes
 where tipo = 'SAIDA' and motivo = 'VENDA'
   and criado_em between $1 and $2;

-- Mais vendidos, separados por categoria. O terceiro parametro filtra por categoria (opcional).
select c.id as categoria_id, c.nome as categoria,
       p.id, p.nome,
       sum(m.quantidade)                    as unidades,
       sum(m.quantidade * m.preco_unitario) as receita
  from public.movimentacoes m
  join public.produtos   p on p.id = m.produto_id
  join public.categorias c on c.id = p.categoria_id
 where m.tipo = 'SAIDA' and m.motivo = 'VENDA'
   and m.criado_em between $1 and $2
   and ($3::int is null or c.id = $3::int)
 group by c.id, c.nome, p.id, p.nome
 order by c.nome, unidades desc;

-- Distribuicao por categoria: unidades e valor imobilizado.
select c.nome,
       count(p.id)                          as produtos,
       coalesce(sum(p.quantidade_atual), 0) as unidades,
       coalesce(sum(p.quantidade_atual * p.preco_venda), 0) as valor_imobilizado
  from public.categorias c
  left join public.produtos p on p.categoria_id = c.id and p.ativo
 where c.ativo
 group by c.id, c.nome
 order by unidades desc;
