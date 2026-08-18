-- NoStock — seed
-- Cria apenas o gestor inicial e as categorias base. Dados de demonstracao ficam em seed-demo.sql.
-- Reexecutavel.

-- O hash bcrypt do gestor e gerado em runtime por `npm run seed`, a partir das variaveis
-- de ambiente, e nunca escrito literalmente aqui. Por isso o insert fica comentado:
-- o script o executa com os parametros ligados.
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
