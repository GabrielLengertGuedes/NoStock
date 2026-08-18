import { Route, Routes } from 'react-router-dom'

import App from '../App.jsx'
import { Categorias } from '../pages/Categorias.jsx'

function NaoEncontrada() {
  return (
    <div className="container mt-base text-center">
      <h1 className="text-h2">Página não encontrada</h1>
      <p className="text-body" style={{ color: 'var(--slate)' }}>
        O endereço digitado não existe no sistema.
      </p>
    </div>
  )
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/categorias" element={<Categorias />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}
