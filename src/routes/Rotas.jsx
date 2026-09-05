import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.js'
import { Categorias } from '../pages/Categorias.jsx'
import { Dashboard } from '../pages/Dashboard.jsx'
import { Fornecedores } from '../pages/Fornecedores.jsx'
import { Login } from '../pages/Login.jsx'
import { Movimentacoes } from '../pages/Movimentacoes.jsx'
import { Produtos } from '../pages/Produtos.jsx'
import { Usuarios } from '../pages/Usuarios.jsx'
import { RotaProtegida } from './RotaProtegida.jsx'

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

function BloqueioDeSessao() {
  const { loginExigido } = useAuth()
  if (!loginExigido) return null
  return <Login modo="bloqueio" />
}

export function Rotas() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RotaProtegida>
              <Navigate to="/dashboard" replace />
            </RotaProtegida>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RotaProtegida>
              <Dashboard />
            </RotaProtegida>
          }
        />
        <Route
          path="/produtos"
          element={
            <RotaProtegida>
              <Produtos />
            </RotaProtegida>
          }
        />
        <Route
          path="/movimentacoes"
          element={
            <RotaProtegida>
              <Movimentacoes />
            </RotaProtegida>
          }
        />
        <Route
          path="/categorias"
          element={
            <RotaProtegida>
              <Categorias />
            </RotaProtegida>
          }
        />
        <Route
          path="/fornecedores"
          element={
            <RotaProtegida>
              <Fornecedores />
            </RotaProtegida>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RotaProtegida papel="GESTOR">
              <Usuarios />
            </RotaProtegida>
          }
        />
        <Route
          path="*"
          element={
            <RotaProtegida>
              <NaoEncontrada />
            </RotaProtegida>
          }
        />
      </Routes>
      <BloqueioDeSessao />
    </>
  )
}
