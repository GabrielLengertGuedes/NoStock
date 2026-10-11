export const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// O usuario escolhe o dia; o periodo vai fechado, do primeiro ao ultimo instante
// dele, senao o proprio dia final ficaria de fora. O instante e resolvido aqui,
// no fuso de quem esta na loja, e viaja em UTC — o fuso do servidor nao desloca
// a borda do dia.
export function instante(dia, hora) {
  if (!dia) return undefined
  const data = new Date(`${dia}T${hora}`)
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString()
}
