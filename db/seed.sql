-- NoStock — seed
-- Cria apenas o gestor inicial e as categorias base. Dados de demonstracao ficam em seed-demo.sql.
-- Reexecutavel.

-- O gestor inicial ja foi criado direto no banco. Nao existe `npm run seed`.
-- O insert fica comentado: o hash bcrypt nunca entra no repositorio.
--
-- insert into public.usuarios (nome, email, senha_hash, papel)
-- values ('Gestor Bioma', $1, $2, 'GESTOR')
-- on conflict (email) do nothing;

insert into public.categorias (nome, descricao) values
  ('Ração',        'Alimentos secos e úmidos'),
  ('Higiene',      'Shampoos, tapetes higiênicos e afins'),
  ('Brinquedos',   'Brinquedos e enriquecimento ambiental'),
  ('Acessórios',   'Coleiras, guias, comedouros'),
  ('Medicamentos', 'Antipulgas, vermífugos e similares')
on conflict (nome) do nothing;
