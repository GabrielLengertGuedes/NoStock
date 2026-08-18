-- NoStock — auditoria de integridade
-- As tres consultas devem retornar zero linhas. Qualquer linha indica inconsistencia.

-- 1. Nenhum saldo negativo
select 'saldo negativo' as verificacao, id, nome, quantidade_atual
  from public.produtos
 where quantidade_atual < 0;

-- 2. Saldo do produto bate com a ultima movimentacao
select 'saldo x ultima movimentacao' as verificacao,
       p.id, p.nome, p.quantidade_atual, m.saldo_posterior
  from public.produtos p
  join lateral (
        select saldo_posterior
          from public.movimentacoes
         where produto_id = p.id
         order by id desc
         limit 1
       ) m on true
 where p.quantidade_atual <> m.saldo_posterior;

-- 3. Cadeia de saldos continua: cada saldo_anterior e o saldo_posterior do anterior
select 'cadeia de saldos' as verificacao,
       m.id, m.produto_id, m.saldo_anterior, m.saldo_posterior_anterior
  from (
        select id, produto_id, saldo_anterior,
               lag(saldo_posterior) over (partition by produto_id order by id)
                 as saldo_posterior_anterior
          from public.movimentacoes
       ) m
 where m.saldo_posterior_anterior is not null
   and m.saldo_anterior <> m.saldo_posterior_anterior;
