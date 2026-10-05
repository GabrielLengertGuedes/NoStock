import { Link, Navigate, Route, Routes } from 'react-router-dom'

import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { Categorias } from '../pages/Categorias.jsx'
import { Dashboard } from '../pages/Dashboard.jsx'
import { Fornecedores } from '../pages/Fornecedores.jsx'
import { Login } from '../pages/Login.jsx'
import { Movimentacoes } from '../pages/Movimentacoes.jsx'
import { ProdutoFormulario } from '../pages/ProdutoFormulario.jsx'
import { Produtos } from '../pages/Produtos.jsx'
import { Relatorios } from '../pages/Relatorios.jsx'
import { Reposicao } from '../pages/Reposicao.jsx'
import { Usuarios } from '../pages/Usuarios.jsx'
import { RotaProtegida } from './RotaProtegida.jsx'

function NaoEncontrada() {
  const menu = useMenuPrincipal()
  return (
    <Layout menu={menu} esconderTitulo>
      <EstadoVazio
        titulo="Página não encontrada"
        descricao="O endereço digitado não existe no sistema."
        acao={
          <Link to="/dashboard" className="btn btn-primary">
            Voltar ao dashboard
          </Link>
        }
      />
    </Layout>
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
          path="/produtos/novo"
          element={
            <RotaProtegida>
              <ProdutoFormulario />
            </RotaProtegida>
          }
        />
        <Route
          path="/produtos/:id/editar"
          element={
            <RotaProtegida>
              <ProdutoFormulario />
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
          path="/relatorios"
          element={
            <RotaProtegida papel="GESTOR">
              <Relatorios />
            </RotaProtegida>
          }
        />
        <Route
          path="/reposicao"
          element={
            <RotaProtegida papel="GESTOR">
              <Reposicao />
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
