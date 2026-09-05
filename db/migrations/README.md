# Migrações

Toda mudança na estrutura do banco entra aqui, como arquivo novo e numerado.
O `db/schema.sql` **não é editado** depois de aplicado — ele é o retrato do dia zero.

```
db/migrations/
  001-adiciona-coluna-x.sql
  002-cria-indice-y.sql
```

## A regra que não pode ser quebrada

O banco do CI é reconstruído do zero a cada Pull Request, aplicando `schema.sql` e depois
cada migração desta pasta, em ordem. Ele só é igual ao Supabase enquanto esta pasta contar a
história inteira.

**Mudou o Supabase pelo SQL editor? A mesma mudança tem que virar um arquivo aqui, na mesma
Pull Request.** Se não virar, o banco do CI fica com a estrutura antiga: os testes passam
contra um banco que não existe mais, e a divergência só aparece em produção.

Vale nos dois sentidos — migração criada aqui também precisa ser aplicada no Supabase à mão,
e avisada no grupo, porque o banco de desenvolvimento é compartilhado
(ADR-013) e não se reconstrói sozinho.

## Como escrever

- Idempotente sempre que der: `create table if not exists`, `add column if not exists`.
  A migração roda do zero no CI a cada PR, e uma vez só no Supabase.
- Uma mudança por arquivo, com o número na frente definindo a ordem.
- Nada de `drop` sem combinar antes: o banco de desenvolvimento é o mesmo para a equipe toda.
