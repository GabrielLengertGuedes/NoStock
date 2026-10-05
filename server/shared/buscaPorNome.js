// Busca por trecho do nome, ignorando acento e caixa. A expressao da coluna e a
// mesma do indice trigram ix_produtos_busca_nome_trgm — mudar uma sem a outra
// faz o banco voltar a ler a tabela inteira a cada busca.
export function condicaoBuscaPorNome(coluna, parametro) {
  return `public.sem_acento(lower(${coluna})) like ('%' || public.sem_acento(lower(${parametro})) || '%')`
}

// O termo vai como texto literal: % e _ digitados nao viram curinga do LIKE.
export function termoLiteral(termo) {
  return termo.replace(/[\\%_]/g, '\\$&')
}
