// Tamanho real dos prints em /public/manual: reserva o espaço antes de a imagem
// carregar (loading="lazy" com altura zero baixaria tudo de uma vez).
const TAMANHO_PADRAO = { largura: 1200, altura: 875 }
const TAMANHO_CELULAR = { largura: 390, altura: 844 }
const TAMANHOS = {
  '02-dashboard.webp': { largura: 1200, altura: 1250 },
  '19-relatorios.webp': { largura: 1200, altura: 968 },
  '20-ranking-geral.webp': { largura: 1200, altura: 943 },
  '24-celular-inicio.webp': { largura: 390, altura: 863 },
}

function tamanhoDa(figura) {
  return TAMANHOS[figura.arquivo] ?? (figura.celular ? TAMANHO_CELULAR : TAMANHO_PADRAO)
}

function SoGestor() {
  return <span className="kpi-pill kpi-pill-ok ajuda-so-gestor">Só gestor</span>
}

function Figura({ figura }) {
  const { largura, altura } = tamanhoDa(figura)
  const src = `/manual/${figura.arquivo}`
  return (
    <figure className={figura.celular ? 'ajuda-figura ajuda-figura-celular' : 'ajuda-figura'}>
      <a href={src} target="_blank" rel="noreferrer" aria-label={`Ampliar: ${figura.legenda}`}>
        <img src={src} alt={figura.legenda} width={largura} height={altura} loading="lazy" decoding="async" />
      </a>
      <figcaption>{figura.legenda} Dados de exemplo.</figcaption>
    </figure>
  )
}

/**
 * Uma seção da ajuda. `comTitulo` fica falso quando quem a envolve já mostra o
 * título (o <summary> do celular).
 */
export function SecaoAjuda({ secao, ehGestor, comTitulo = true }) {
  const figuras = secao.figuras ?? []

  return (
    <>
      {comTitulo ? (
        <div className="ajuda-secao-cabecalho">
          <h3 className="text-h3">{secao.titulo}</h3>
          {ehGestor && secao.perfil === 'GESTOR' ? <SoGestor /> : null}
        </div>
      ) : null}

      <p className="ajuda-caminho">
        <span className="ajuda-rotulo">Onde</span>
        {secao.caminho}
      </p>

      {secao.passos.length > 0 ? (
        <ol className="ajuda-passos">
          {secao.passos.map((passo) => {
            const texto = typeof passo === 'string' ? passo : passo.texto
            return (
              <li key={texto}>
                {texto}
                {ehGestor && passo.gestor ? <SoGestor /> : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {secao.tabela ? (
        <div className="ajuda-tabela-rolagem">
          <table className="ajuda-tabela">
            <caption>{secao.tabela.titulo}</caption>
            <thead>
              <tr>
                {secao.tabela.colunas.map((coluna) => (
                  <th key={coluna} scope="col">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secao.tabela.linhas.map((linha) => (
                <tr key={linha[0]}>
                  {/* Chave pela coluna: o texto pode repetir na linha ("Saldo 0" em duas). */}
                  {linha.map((celula, indice) =>
                    indice === 0 ? (
                      <th key={secao.tabela.colunas[indice]} scope="row">
                        {celula}
                      </th>
                    ) : (
                      <td key={secao.tabela.colunas[indice]}>{celula}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {secao.perguntas ? (
        <dl className="ajuda-perguntas">
          {secao.perguntas.map(([pergunta, resposta]) => (
            <div key={pergunta}>
              <dt>{pergunta}</dt>
              <dd>{resposta}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {secao.nota ? <p className="ajuda-nota">{secao.nota}</p> : null}

      {figuras.length > 0 ? (
        <div className="ajuda-figuras">
          {figuras.map((figura) => (
            <Figura key={figura.arquivo} figura={figura} />
          ))}
        </div>
      ) : null}
    </>
  )
}
