import { Navigate, Route, Routes } from 'react-router-dom'

import '../styles/movel.css'
import { RegistroMovelProvider } from '../components/movel/RegistroMovelProvider.jsx'
import { ContaMovel } from '../pages/movel/ContaMovel.jsx'
import { EstoqueMovel } from '../pages/movel/EstoqueMovel.jsx'
import { HistoricoMovel } from '../pages/movel/HistoricoMovel.jsx'
import { InicioMovel } from '../pages/movel/InicioMovel.jsx'
import { ProdutoMovel } from '../pages/movel/ProdutoMovel.jsx'
import { ReporMovel } from '../pages/movel/ReporMovel.jsx'

/**
 * Versão para celular, em /m. É onde o app instalado abre (manifest.webmanifest)
 * e para onde os alertas push levam. Cadastros, usuários e relatórios ficam só
 * na versão completa.
 */
export function RotasMovel() {
  return (
    <RegistroMovelProvider>
      <Routes>
        <Route index element={<InicioMovel />} />
        <Route path="estoque" element={<EstoqueMovel />} />
        <Route path="produtos/:id" element={<ProdutoMovel />} />
        <Route path="historico" element={<HistoricoMovel />} />
        <Route path="repor" element={<ReporMovel />} />
        <Route path="conta" element={<ContaMovel />} />
        <Route path="*" element={<Navigate to="/m" replace />} />
      </Routes>
    </RegistroMovelProvider>
  )
}
