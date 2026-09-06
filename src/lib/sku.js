function tokenDe(texto = '') {
  const limpo = String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
  return limpo.slice(0, 4) || 'ITEM'
}

/** Código visual estilo Figma (BIO-DOG-0015), derivado da categoria + id. */
export function skuDoProduto({ id, categoria, nome } = {}) {
  const categoriaNome = typeof categoria === 'string' ? categoria : categoria?.nome
  const token = tokenDe(categoriaNome || nome)
  if (id == null || id === '') return `BIO-${token}`
  return `BIO-${token}-${String(id).padStart(4, '0')}`
}
