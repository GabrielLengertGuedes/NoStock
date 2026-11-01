/**
 * Conteúdo da ajuda ("Como usar"), adaptado do Manual de Uso entregue em
 * 26/10/2026. Fica em dados para a versão completa (/ajuda) e a do celular
 * (/m/ajuda) lerem a mesma fonte.
 *
 * Cada seção tem:
 *  - perfil: 'TODOS' ou 'GESTOR'. Seção de gestor não aparece para operador,
 *    a mesma regra do menu.
 *  - passos: texto, ou { texto, gestor: true } para o passo que só o gestor faz.
 *  - figuras: prints em /public/manual, feitos com dados fictícios.
 *
 * Ao mudar uma tela, revise a seção dela aqui e, se a tela mudou de cara, o print.
 */

export const GRUPOS = [
  {
    id: 'primeiros-passos',
    titulo: 'Primeiros passos',
    secoes: [
      {
        id: 'perfis',
        titulo: 'Perfis e permissões',
        caminho: 'Menu principal',
        perfil: 'TODOS',
        passos: [
          'Gestor e operador acessam o dashboard, consultam o estoque, cadastram e editam produtos, registram entradas e saídas e consultam o histórico, as categorias e os fornecedores.',
          'O gestor também exclui e reativa produtos; cria, edita e inativa categorias e fornecedores; vê relatórios e a sugestão de compra; e administra os usuários.',
          'O menu mostra só as áreas liberadas para a sua conta. Precisa de uma ação de gestor? Peça a um gestor da loja.',
        ],
        figuras: [{ arquivo: '32-perfil-operador.webp', legenda: 'Menu de um operador.' }],
      },
      {
        id: 'entrar-e-sair',
        titulo: 'Entrar, recuperar acesso e sair',
        caminho: '/login',
        perfil: 'TODOS',
        passos: [
          'Informe o e-mail e a senha que o gestor passou e clique em Entrar. O ícone de olho mostra a senha digitada.',
          'Não existe cadastro público: quem cria as contas é o gestor, em Usuários.',
          'Esqueceu a senha? Peça a um gestor para redefinir em Usuários. O sistema não envia recuperação por e-mail.',
          'Se aparecer o aviso de muitas tentativas, aguarde o tempo indicado na mensagem e confira os dados antes de tentar de novo. Se a sessão expirar, entre de novo para continuar.',
          'Ao terminar, clique em Sair no rodapé do menu. No celular, abra Sua conta e toque em Sair.',
        ],
        nota: 'Em computador compartilhado, sempre saia da conta no fim do uso.',
        figuras: [{ arquivo: '01-login.webp', legenda: 'Tela de login.' }],
      },
      {
        id: 'rotina',
        titulo: 'Rotina sugerida para a loja',
        caminho: 'Roteiro do dia a dia',
        perfil: 'TODOS',
        passos: [
          { texto: 'Preparação: cadastre categorias, fornecedores e a equipe, conferindo o papel de cada pessoa.', gestor: true },
          'Cadastre os produtos com o estoque inicial contado e o mínimo definido.',
          'Início do dia: entre com a sua conta, revise o dashboard e os alertas e avise a gestão sobre produtos zerados ou críticos.',
          'Mercadoria chegou: confira o produto e a quantidade física e registre uma Entrada por Compra.',
          'Venda ou descarte: registre a Saída com o motivo certo e confira se o saldo depois bate com o que aconteceu.',
          { texto: 'Reposição: abra a Sugestão de compra, filtre o fornecedor, imprima a lista e combine o pedido. Registre a entrada só quando a mercadoria chegar.', gestor: true },
          'Fechamento: confira as movimentações do dia, comunique divergências e saia da conta.',
          'De tempos em tempos, compare o estoque físico com o saldo do sistema e leve as diferenças ao gestor.',
        ],
      },
    ],
  },
  {
    id: 'painel',
    titulo: 'Painel e alertas',
    secoes: [
      {
        id: 'dashboard',
        titulo: 'Acompanhar o dashboard',
        caminho: 'Dashboard',
        perfil: 'TODOS',
        passos: [
          'Os indicadores mostram Total de itens, Estoque baixo, Sem estoque e Entradas (hoje). Entradas e saídas contam registros, não unidades.',
          'Comece por Produtos em atenção: primeiro os sem estoque, depois os críticos e os baixos. Ver todos abre o catálogo já filtrado.',
          'No menu de três pontos de um produto, escolha Registrar entrada ou Registrar saída. O produto já vem selecionado.',
          'O quadro Insights estima quanto falta, em preço de venda, para os saldos voltarem ao mínimo. Serve para priorizar, não é orçamento de compra.',
          'O botão + flutuante abre uma entrada de estoque.',
        ],
        figuras: [{ arquivo: '02-dashboard.webp', legenda: 'Dashboard.' }],
      },
      {
        id: 'status-e-alertas',
        titulo: 'Entender os status e os alertas',
        caminho: 'Sino no topo',
        perfil: 'TODOS',
        passos: [
          'Clique no sino para ver quantos produtos precisam de reposição. O painel mostra até 5; Ver todos os alertas abre a lista completa.',
          'Clique em um alerta para abrir o produto no catálogo. O número no sino conta produtos, não unidades a comprar.',
        ],
        tabela: {
          titulo: 'Como o status é calculado',
          colunas: ['Status', 'Quando', 'Exemplo com mínimo 10'],
          linhas: [
            ['Sem estoque', 'Saldo 0', 'Saldo 0'],
            ['Crítico', 'Até a metade do mínimo, arredondada para cima', 'Saldo de 1 a 5'],
            ['Baixo (Atenção)', 'Acima disso e até o mínimo', 'Saldo de 6 a 10'],
            ['Normal (OK)', 'Acima do mínimo', 'Saldo 11 ou mais'],
          ],
        },
        nota: 'Saldo igual ao mínimo já aparece em atenção. Com mínimo 0, o produto só entra na reposição quando zera.',
        figuras: [{ arquivo: '03-alertas.webp', legenda: 'Painel de alertas aberto pelo sino.' }],
      },
    ],
  },
  {
    id: 'produtos',
    titulo: 'Produtos',
    secoes: [
      {
        id: 'buscar-produtos',
        titulo: 'Buscar e filtrar produtos',
        caminho: 'Produtos',
        perfil: 'TODOS',
        passos: [
          'Digite parte do nome na busca do topo. Em outras telas, a busca leva para Produtos quando você aperta Enter.',
          'Combine a busca com Categoria e com os filtros Todos, Críticos, Atenção, Em dia e Sem estoque. Atenção reúne baixos, críticos e zerados.',
          'Cada linha mostra categoria, quantidade, mínimo, preço e status. Os indicadores do topo resumem o catálogo inteiro, não só o filtro.',
          'Abra os três pontos da linha para movimentar ou editar o produto.',
          { texto: 'O gestor também vê Excluir e o filtro Situação, que mostra os produtos excluídos.', gestor: true },
        ],
        figuras: [
          { arquivo: '04-produtos.webp', legenda: 'Lista de produtos.' },
          { arquivo: '05-filtro-sem-estoque.webp', legenda: 'Filtro Sem estoque aplicado.' },
        ],
      },
      {
        id: 'cadastrar-produto',
        titulo: 'Cadastrar um produto',
        caminho: 'Produtos › Novo produto',
        perfil: 'TODOS',
        passos: [
          'A categoria precisa existir antes. Se não existir, peça ao gestor. O fornecedor é opcional, mas organiza a compra.',
          'Preencha Nome, Categoria, Preço de venda, Estoque mínimo e Estoque inicial. Descrição e Fornecedor são opcionais. Estoques são números inteiros.',
          'Conte o estoque físico antes de informar o inicial. Se for maior que zero, ele aparece no histórico como estoque inicial.',
          'Confira a pré-visualização e clique em Salvar produto.',
          'Se o sistema avisar que já existe um produto com o mesmo nome, confira o catálogo. Use Salvar mesmo assim só se a repetição for proposital.',
        ],
        figuras: [{ arquivo: '06-novo-produto.webp', legenda: 'Cadastro de produto.' }],
      },
      {
        id: 'editar-produto',
        titulo: 'Editar produto e incluir imagem',
        caminho: 'Produtos › três pontos › Editar',
        perfil: 'TODOS',
        passos: [
          'Altere nome, descrição, categoria, fornecedor, preço ou estoque mínimo e clique em Salvar produto.',
          'O SKU é gerado sozinho. O saldo aparece só para consulta: para mudá-lo, registre uma movimentação.',
          'Em Mídia do produto, escolha uma imagem do seu aparelho. Use Trocar imagem ou Remover quando precisar.',
          'Mudar o preço vale para os próximos registros. As vendas já feitas guardam o preço da época.',
        ],
        nota: 'A imagem fica guardada só neste navegador. Ela não aparece em outro computador ou celular, e limpar os dados do navegador pode apagá-la.',
        figuras: [{ arquivo: '07-editar-produto.webp', legenda: 'Edição de produto.' }],
      },
      {
        id: 'excluir-produto',
        titulo: 'Excluir e reativar produtos',
        caminho: 'Produtos › três pontos › Excluir',
        perfil: 'GESTOR',
        passos: [
          'Abra os três pontos do produto, escolha Excluir e confirme.',
          'O produto sai do catálogo e não recebe novas movimentações, mas o histórico dele continua guardado.',
          'Para recuperar, mude Situação para Excluídos, abra os três pontos do produto e clique em Reativar.',
          'Volte para Situação › Ativos e confira se o produto voltou. Revise também a categoria e o fornecedor dele.',
        ],
        nota: 'Reative o produto antigo em vez de cadastrar outro igual.',
        figuras: [
          { arquivo: '08-excluir-produto.webp', legenda: 'Confirmação de exclusão.' },
          { arquivo: '09-reativar-produto.webp', legenda: 'Reativar um produto excluído.' },
        ],
      },
    ],
  },
  {
    id: 'cadastros',
    titulo: 'Categorias e fornecedores',
    secoes: [
      {
        id: 'categorias',
        titulo: 'Consultar e organizar categorias',
        caminho: 'Categorias',
        perfil: 'TODOS',
        passos: [
          'Cada categoria mostra quantos produtos tem e quantas unidades estão em estoque.',
          { texto: 'Para criar, clique em Nova categoria, informe um nome único com pelo menos 2 letras e salve.', gestor: true },
          { texto: 'Para alterar, use três pontos › Editar.', gestor: true },
          { texto: 'Para retirar, use três pontos › Inativar. Categoria com produtos ativos não pode ser inativada: mude esses produtos de categoria antes.', gestor: true },
          { texto: 'Categorias inativas ficam numa seção própria, com o botão Reativar.', gestor: true },
        ],
        notaOperador: 'Criar, editar e inativar categorias fica com o gestor.',
        figuras: [
          { arquivo: '14-categorias.webp', legenda: 'Categorias.' },
          { arquivo: '15-nova-categoria.webp', legenda: 'Nova categoria.', gestor: true },
        ],
      },
      {
        id: 'fornecedores',
        titulo: 'Consultar fornecedores e contatos',
        caminho: 'Fornecedores',
        perfil: 'TODOS',
        passos: [
          'Veja nome, CNPJ, pessoa de contato e quantos produtos cada fornecedor tem.',
          'Clique no telefone para ligar, no ícone do WhatsApp para abrir uma conversa ou no e-mail para escrever.',
          'Esses atalhos só abrem o contato. O pedido você escreve e envia; o sistema não faz compra sozinho.',
          { texto: 'Use três pontos › Editar para corrigir os dados ou Inativar para retirar. Fornecedor com produtos ativos não pode ser inativado.', gestor: true },
          { texto: 'Fornecedores inativos ficam numa seção própria, com o botão Reativar.', gestor: true },
        ],
        figuras: [{ arquivo: '16-fornecedores.webp', legenda: 'Fornecedores.' }],
      },
      {
        id: 'cadastrar-fornecedor',
        titulo: 'Cadastrar e editar fornecedor',
        caminho: 'Fornecedores › Novo fornecedor',
        perfil: 'GESTOR',
        passos: [
          'Clique em Novo fornecedor e preencha o Nome e pelo menos um contato: telefone com DDD ou e-mail.',
          'CNPJ, nome do contato e observação são opcionais. O CNPJ, se informado, precisa ser válido e não pode repetir outro fornecedor.',
          'Confira telefone e e-mail: eles viram os atalhos de contato e aparecem na sugestão de compra. Clique em Salvar.',
          'Para ligar o fornecedor a um produto, edite o produto e escolha o fornecedor no campo Fornecedor.',
        ],
        figuras: [{ arquivo: '17-novo-fornecedor.webp', legenda: 'Novo fornecedor.' }],
      },
    ],
  },
  {
    id: 'movimentacoes',
    titulo: 'Entradas e saídas',
    secoes: [
      {
        id: 'registrar-entrada',
        titulo: 'Registrar entrada de estoque',
        caminho: 'Movimentações › Registrar entrada',
        perfil: 'TODOS',
        passos: [
          'Clique em Registrar entrada. Pelos três pontos de um produto, no Dashboard ou em Produtos, ele já vem selecionado.',
          'Busque e selecione o produto, se precisar, e confira o saldo atual.',
          'Escolha o motivo: Compra para mercadoria recebida, Devolução para item que voltou ao estoque. A quantidade é um número inteiro maior que zero.',
          'Use a Observação para anotar a nota ou o motivo. Clique em Registrar uma vez só e espere a resposta.',
          'A confirmação mostra o saldo antes, o saldo depois e o novo status. Exemplo: saldo 2 + entrada 8 = saldo 10.',
        ],
        figuras: [
          { arquivo: '11-entrada.webp', legenda: 'Registrar entrada.' },
          { arquivo: '12-confirmacao-entrada.webp', legenda: 'Confirmação com os saldos.' },
        ],
      },
      {
        id: 'registrar-saida',
        titulo: 'Registrar saída',
        caminho: 'Movimentações › Registrar saída',
        perfil: 'TODOS',
        passos: [
          'Clique em Registrar saída, busque o produto e confira o saldo disponível.',
          'Escolha Venda ou Descarte (perda ou retirada). Informe a quantidade e, se precisar, uma observação.',
          'Clique em Registrar e espere a confirmação. As vendas entram nos indicadores de receita e unidades vendidas.',
          'Se a quantidade for maior que o saldo, o sistema recusa. Confira a contagem física e o produto escolhido. Não registre uma entrada falsa só para liberar a saída.',
        ],
        nota: 'Se a conexão cair no meio do registro, consulte o histórico antes de repetir, para não lançar a mesma saída duas vezes.',
        figuras: [{ arquivo: '13-saida-saldo-insuficiente.webp', legenda: 'Aviso de saldo insuficiente.' }],
      },
      {
        id: 'historico',
        titulo: 'Consultar o histórico',
        caminho: 'Movimentações',
        perfil: 'TODOS',
        passos: [
          'A lista vai do registro mais recente ao mais antigo, com data, tipo, motivo, produto, quantidade e quem registrou.',
          'Use De e Até para o período e combine com o tipo (Todos, Entrada, Saída ou Ajuste), a busca por nome e o filtro de Produto.',
          { texto: 'O gestor também pode filtrar por Funcionário.', gestor: true },
          'Limpar filtros volta para a visão geral. Os registros de produtos excluídos continuam aparecendo.',
        ],
        figuras: [{ arquivo: '10-historico.webp', legenda: 'Histórico de movimentações.' }],
      },
      {
        id: 'divergencias',
        titulo: 'Corrigir um registro errado',
        caminho: 'Movimentações',
        perfil: 'TODOS',
        passos: [
          'Depois de cada lançamento, confira no histórico o produto, o tipo, o motivo e a quantidade.',
          'Movimentações não podem ser editadas nem apagadas: o histórico fica preservado.',
          'Achou um erro? Anote qual registro está errado e avise o gestor. O acerto do saldo é feito por um ajuste de inventário, que ainda não tem tela e é feito pelo responsável técnico junto com o gestor.',
          'Editar o produto não muda o saldo.',
        ],
        nota: 'No histórico, um registro do tipo Ajuste mostra o saldo final definido, não a quantidade que entrou ou saiu.',
      },
    ],
  },
  {
    id: 'compras',
    titulo: 'Compras e relatórios',
    secoes: [
      {
        id: 'sugestao-de-compra',
        titulo: 'Planejar a reposição',
        caminho: 'Sugestão de compra',
        perfil: 'GESTOR',
        passos: [
          'A tela junta os produtos sem estoque, críticos ou baixos, agrupados por fornecedor.',
          'Filtre por Todos, Sem estoque, Críticos ou Baixos e escolha um fornecedor, se quiser.',
          'A sugestão de compra é o dobro do mínimo menos o saldo, nunca menos que 1. Exemplo: mínimo 10 e saldo 2 sugerem 18 unidades.',
          'Produtos sem fornecedor ficam em Sem fornecedor definido. Edite o produto para organizar as próximas compras.',
        ],
        nota: 'A sugestão ajuda a decidir; confira a saída do produto e as condições do fornecedor antes de comprar.',
        figuras: [{ arquivo: '18-sugestao-compra.webp', legenda: 'Sugestão de compra.' }],
      },
      {
        id: 'imprimir-lista',
        titulo: 'Imprimir ou salvar a lista de compra',
        caminho: 'Sugestão de compra › Imprimir / Exportar',
        perfil: 'GESTOR',
        passos: [
          'Aplique os filtros antes. O botão Imprimir / Exportar aparece quando há itens a repor.',
          'Na janela que abrir, escolha a impressora ou Salvar como PDF.',
          'A impressão sai sem o menu e sem os filtros, só com a lista.',
          'Gerar a lista não muda o estoque. Quando a mercadoria chegar, registre a Entrada por Compra de cada produto.',
        ],
      },
      {
        id: 'relatorios',
        titulo: 'Consultar relatórios',
        caminho: 'Relatórios',
        perfil: 'GESTOR',
        passos: [
          'Escolha as datas De e Até. Ao abrir, a tela mostra os últimos 30 dias.',
          'Total vendido soma quantidade × preço das saídas por Venda. Descarte não conta como venda.',
          'Giro de estoque compara as unidades vendidas com o saldo médio do período. Um traço quer dizer que não dá para calcular.',
          'A distribuição por categoria mostra o estoque de agora e não muda com as datas. O valor usa preço de venda; não é lucro nem custo.',
        ],
        figuras: [{ arquivo: '19-relatorios.webp', legenda: 'Relatórios.' }],
      },
      {
        id: 'ranking',
        titulo: 'Alternar a visão do ranking',
        caminho: 'Relatórios › Ranking de produtos',
        perfil: 'GESTOR',
        passos: [
          'Agrupado por categoria mostra os mais vendidos dentro de cada categoria, com unidades e receita.',
          'Lista geral compara todos os produtos numa lista só.',
          'Se aparecer Nenhuma venda no período, confira as datas. Entradas, descartes e devoluções não contam.',
        ],
        figuras: [{ arquivo: '20-ranking-geral.webp', legenda: 'Ranking em lista geral.' }],
      },
    ],
  },
  {
    id: 'equipe',
    titulo: 'Equipe',
    secoes: [
      {
        id: 'usuarios',
        titulo: 'Consultar a equipe',
        caminho: 'Usuários',
        perfil: 'GESTOR',
        passos: [
          'Veja nome, e-mail, papel e status de cada pessoa. Alterne entre Ativos, Inativos e Todos.',
          'Os três pontos de cada pessoa mostram as ações: Editar, Redefinir senha e Inativar ou Reativar.',
          'O sistema não deixa inativar nem rebaixar o último gestor ativo.',
        ],
        figuras: [{ arquivo: '21-usuarios.webp', legenda: 'Usuários.' }],
      },
      {
        id: 'cadastrar-usuario',
        titulo: 'Cadastrar e editar usuários',
        caminho: 'Usuários › Novo usuário',
        perfil: 'GESTOR',
        passos: [
          'Clique em Novo usuário e preencha Nome (3 letras ou mais), E-mail, Senha inicial (8 caracteres ou mais) e Papel.',
          'Operador faz a operação do dia a dia. Gestor também acessa cadastros, relatórios e usuários.',
          'Salve e entregue o acesso diretamente para a pessoa.',
          'Para editar, use três pontos › Editar. Editar não muda a senha; para isso há a ação Redefinir senha.',
        ],
        figuras: [{ arquivo: '22-novo-usuario.webp', legenda: 'Novo usuário.' }],
      },
      {
        id: 'redefinir-senha',
        titulo: 'Redefinir a senha de alguém',
        caminho: 'Usuários › três pontos › Redefinir senha',
        perfil: 'GESTOR',
        passos: [
          'Confira o nome na janela, digite a nova senha (8 caracteres ou mais) e clique em Salvar senha. Não precisa saber a senha antiga.',
          'A pessoa é desconectada dos aparelhos em que estava e precisa entrar de novo com a senha nova.',
          'Se você redefinir a própria senha, continua conectado neste aparelho.',
        ],
        figuras: [{ arquivo: '23-redefinir-senha.webp', legenda: 'Redefinir senha.' }],
      },
      {
        id: 'inativar-usuario',
        titulo: 'Inativar e reativar usuários',
        caminho: 'Usuários › três pontos › Inativar',
        perfil: 'GESTOR',
        passos: [
          'Escolha Inativar e confirme. A pessoa perde o acesso, mas o nome dela continua no histórico.',
          'Não dá para inativar a própria conta; para isso, use Sair.',
          'Para devolver o acesso, mostre Inativos, abra os três pontos da pessoa e clique em Reativar. Revise o papel e, se precisar, redefina a senha.',
        ],
      },
    ],
  },
  {
    id: 'celular',
    titulo: 'No celular',
    celular: true,
    secoes: [
      {
        id: 'abrir-no-celular',
        titulo: 'Abrir a versão para celular',
        caminho: 'Endereço do sistema + /m',
        perfil: 'TODOS',
        passos: [
          'No navegador do celular, abra o endereço do sistema com /m no final e entre. Pelo app instalado, ele já abre aí.',
          'O Início mostra Sem estoque, Precisa repor e as entradas e saídas de hoje. Toque num número para ver os produtos.',
          'Use as abas Início, Estoque e Histórico.',
          { texto: 'O gestor também vê a aba Repor.', gestor: true },
          'O botão Registrar faz uma movimentação rápida. Cadastros e relatórios ficam na versão completa, que abre por Sua conta.',
        ],
        figuras: [{ arquivo: '24-celular-inicio.webp', legenda: 'Início no celular.', celular: true }],
      },
      {
        id: 'estoque-no-celular',
        titulo: 'Buscar um produto no celular',
        caminho: 'Estoque',
        perfil: 'TODOS',
        passos: [
          'Em Estoque, digite parte do nome e use Todos, Precisa repor ou Sem estoque.',
          'Toque no produto para ver saldo, mínimo, status, fornecedor e as últimas movimentações.',
          { texto: 'Para gestores, um produto em atenção mostra também a sugestão de compra.', gestor: true },
          'Toque em Entrada ou Saída, no rodapé, para registrar com o produto já escolhido. Saída fica desligada quando o saldo é zero.',
        ],
        figuras: [
          { arquivo: '25-celular-estoque.webp', legenda: 'Estoque no celular.', celular: true },
          { arquivo: '26-celular-produto.webp', legenda: 'Detalhe do produto.', celular: true },
        ],
      },
      {
        id: 'registrar-no-celular',
        titulo: 'Registrar entrada ou saída no celular',
        caminho: 'Registrar',
        perfil: 'TODOS',
        passos: [
          'Toque em Registrar, escolha Entrada ou Saída e busque o produto.',
          'Escolha o motivo: Compra ou Devolução para entrada; Venda ou Descarte para saída. Ajuste a quantidade digitando ou com os botões − e +.',
          'Confira o Saldo depois. Se faltar saldo para a saída, a tela avisa e não deixa confirmar.',
          'Toque em Registrar e espere a confirmação. Depois use Registrar outra ou Concluir.',
        ],
        nota: 'Sem internet não dá para registrar. Não há fila para enviar depois.',
        figuras: [
          { arquivo: '30-celular-entrada.webp', legenda: 'Registrar entrada.', celular: true },
          { arquivo: '31-celular-confirmacao.webp', legenda: 'Confirmação.', celular: true },
        ],
      },
      {
        id: 'historico-no-celular',
        titulo: 'Histórico e reposição no celular',
        caminho: 'Histórico · Repor',
        perfil: 'TODOS',
        passos: [
          'Em Histórico, alterne Tudo, Entradas e Saídas. Os registros vêm separados por dia; toque em um para abrir o produto.',
          'Para filtrar por data, produto ou funcionário, use Movimentações na versão completa.',
          { texto: 'Em Repor, filtre por situação e toque no nome do fornecedor para abrir ou fechar a lista dele. Os atalhos de WhatsApp, ligação e e-mail aparecem quando o contato está cadastrado.', gestor: true },
        ],
        figuras: [
          { arquivo: '27-celular-historico.webp', legenda: 'Histórico.', celular: true },
          { arquivo: '28-celular-repor.webp', legenda: 'Repor.', celular: true, gestor: true },
        ],
      },
      {
        id: 'alertas-no-celular',
        titulo: 'Ligar os alertas no celular',
        caminho: 'Início › avatar › Sua conta',
        perfil: 'TODOS',
        passos: [
          'Em Alertas de estoque, escolha quando ser avisado: abaixo do mínimo, crítico ou só quando acabar.',
          'Toque em Ativar alertas e permita as notificações.',
          'Use Enviar alerta de teste para conferir. Para parar, toque em Desligar alertas.',
          'O alerta chega quando uma saída piora a situação de um produto até o nível escolhido.',
        ],
        nota: 'Sair da conta também desliga os alertas deste celular.',
        figuras: [{ arquivo: '29-celular-conta.webp', legenda: 'Sua conta e alertas.', celular: true }],
      },
      {
        id: 'instalar-app',
        titulo: 'Instalar o app no celular',
        caminho: 'Navegador do celular',
        perfil: 'TODOS',
        passos: [
          'Android: abra o sistema no Chrome e use Instalar app ou Adicionar à tela inicial.',
          'iPhone: abra no Safari, toque em Compartilhar › Adicionar à Tela de Início e abra pelo ícone.',
          'No iPhone, os alertas pedem iOS 16.4 ou mais novo e só funcionam com o app aberto pelo ícone.',
          'Se as notificações estiverem bloqueadas, libere nas configurações do navegador e volte para Sua conta.',
        ],
        nota: 'Mesmo instalado, o app precisa de internet para mostrar o saldo e registrar movimentações.',
      },
    ],
  },
  {
    id: 'duvidas',
    titulo: 'Dúvidas',
    celular: true,
    secoes: [
      {
        id: 'mensagens-comuns',
        titulo: 'Mensagens comuns e o que fazer',
        caminho: 'Tela em que o aviso apareceu',
        perfil: 'TODOS',
        perguntas: [
          ['E-mail ou senha incorretos', 'Confira a digitação. Se não lembrar a senha, peça a um gestor para redefinir.'],
          ['Muitas tentativas', 'Espere o tempo indicado na mensagem antes de tentar de novo.'],
          ['Sessão expirada', 'Entre de novo e confira se a última operação foi salva antes de repetir.'],
          ['Sem resposta do servidor', 'Confira a internet. Se continuar, avise quem cuida do sistema.'],
          ['Campo obrigatório ou inválido', 'Corrija o campo destacado. Estoques e quantidades são inteiros; telefone precisa de DDD; fornecedor precisa de telefone ou e-mail.'],
          ['Produto não encontrado', 'Tire os filtros e confira o nome. O gestor pode procurar em Situação › Excluídos.'],
          ['Saldo insuficiente', 'Confira o produto, a quantidade e a contagem física. Diferença no estoque vai para o gestor.'],
          ['Não consigo inativar categoria ou fornecedor', 'Ainda há produtos ativos ligados a ele. Mude esses produtos antes.'],
          ['A imagem do produto sumiu em outro aparelho', 'A imagem fica guardada só no navegador em que foi colocada.'],
          ['Lista vazia', 'Confira os filtros e o período. Se apareceu erro de carregamento, não é sinal de estoque em dia.'],
        ],
        nota: 'Ao pedir ajuda, diga a tela, o horário, o que tentou fazer e a mensagem completa. Se mandar print, não mostre senhas.',
      },
      {
        id: 'sem-tela',
        titulo: 'O que ainda não tem tela',
        caminho: 'Fale com o gestor',
        perfil: 'TODOS',
        passos: [
          'Ajuste de inventário (acertar o saldo depois de uma contagem): é feito pelo responsável técnico junto com o gestor.',
          'Trocar a própria senha: peça ao gestor para redefinir.',
          'Backup: fica com o responsável técnico.',
        ],
      },
    ],
  },
]

/** Grupos e seções que a pessoa pode ver, sem os passos e prints só de gestor. */
export function conteudoParaPerfil(ehGestor, grupos = GRUPOS) {
  return grupos
    .map((grupo) => ({
      ...grupo,
      secoes: grupo.secoes
        .filter((secao) => ehGestor || secao.perfil !== 'GESTOR')
        .map((secao) => ({
          ...secao,
          passos: (secao.passos ?? []).filter((passo) => ehGestor || !passo.gestor),
          figuras: (secao.figuras ?? []).filter((figura) => ehGestor || !figura.gestor),
          nota: secao.nota ?? (ehGestor ? undefined : secao.notaOperador),
        })),
    }))
    .filter((grupo) => grupo.secoes.length > 0)
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function textoDaSecao(secao) {
  const partes = [
    secao.titulo,
    secao.caminho,
    secao.nota ?? '',
    ...secao.passos.map((passo) => (typeof passo === 'string' ? passo : passo.texto)),
    ...(secao.perguntas ?? []).flat(),
    ...(secao.tabela?.linhas ?? []).flat(),
  ]
  return normalizar(partes.join(' '))
}

/** Filtra as seções pelo termo, ignorando acento e maiúscula. */
export function filtrarConteudo(grupos, termo) {
  const busca = normalizar(termo.trim())
  if (!busca) return grupos
  return grupos
    .map((grupo) => ({ ...grupo, secoes: grupo.secoes.filter((secao) => textoDaSecao(secao).includes(busca)) }))
    .filter((grupo) => grupo.secoes.length > 0)
}
