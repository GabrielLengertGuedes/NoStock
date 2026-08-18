import { EstadoVazio } from './EstadoVazio.jsx'

// colunas: [{ chave, titulo, alinhamento, render }]
export function Tabela({ colunas, dados, chaveDaLinha = (item) => item.id, carregando = false, vazio }) {
  if (carregando) {
    return (
      <p className="text-body" style={{ color: 'var(--slate)' }} role="status">
        Carregando…
      </p>
    )
  }

  if (dados.length === 0) {
    return vazio ?? <EstadoVazio titulo="Nada por aqui ainda" />
  }

  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna.chave} scope="col" style={{ textAlign: coluna.alinhamento ?? 'left' }}>
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={chaveDaLinha(item)}>
              {colunas.map((coluna) => (
                <td key={coluna.chave} style={{ textAlign: coluna.alinhamento ?? 'left' }}>
                  {coluna.render ? coluna.render(item) : item[coluna.chave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
