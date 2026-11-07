# Manu Saúde

Plataforma de consultórios online com Node.js 22, Express e PostgreSQL 17.

## Funcionalidades

Cadastro e login com senhas protegidas por scrypt, sessões em cookie HttpOnly, acesso privado por proprietário, página pública do consultório, perfil com logo/foto, pacientes, agenda diária, calendário mensal compacto e catálogo de serviços. A gravação no banco verifica a versão dos dados para evitar sobrescrever alterações simultâneas e respeita a capacidade simultânea e rejeita novas consultas fora dos horários de atendimento.

A recuperação de senha por e-mail, verificação de e-mail, assinaturas, cobrança, reserva pública automática e automação de WhatsApp ainda não estão habilitadas. O botão de WhatsApp abre uma mensagem para envio manual.

## EasyPanel

- Repositório: `marcosgisele2203-art/Manu-Sa-de`
- Branch: `main`
- Build: Dockerfile na raiz
- Porta interna: **8080**, HTTP; domínio externo com **HTTPS**.

No serviço da aplicação, configure as variáveis `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` e `PGPASSWORD`, copiando os valores do banco pelo painel. Não envie a senha ao GitHub nem a mensagens. Opcionalmente, `APP_URL` pode receber o endereço HTTPS da plataforma, sem barra final, para fixar a origem permitida. `NODE_ENV=production` e `PORT=8080` já estão definidos no Dockerfile.

Ao iniciar, a aplicação cria as tabelas `manu_*` no banco configurado, sem alterar tabelas de outras aplicações. Não são necessários comandos SQL manuais. `/healthz` verifica a conexão com PostgreSQL. A aplicação não inicia se o banco estiver inacessível.

Os arquivos de imagem são armazenados no perfil no banco, com limite de 500 KB por imagem. Configure backups do PostgreSQL no EasyPanel antes de usar informações reais. Use um banco exclusivo para a plataforma. Não exponha o banco à internet.

Após implantar, acesse `/conta.html` e crie uma conta para testar. Cadastre o consultório, abra seu painel e agende uma consulta. Faça login em outro dispositivo para conferir a persistência. Os dados da demonstração antiga ficam no navegador e não são importados automaticamente.

`/painel.html?consultorio=exemplo-ana` continua sendo um exemplo fictício, com dados locais. Consultórios de contas reais usam o backend e não gravam pacientes no localStorage.

## Desenvolvimento e testes

```sh
npm ci
# Defina as variáveis PG* para um PostgreSQL local de testes.
PORT=18080 NODE_ENV=test npm start
# Em outro terminal:
npm test
```

`npm test` roda testes de integração contra `http://127.0.0.1:18080`. Use exclusivamente banco descartável: os testes criam contas e consultórios fictícios. Para outro endereço, configure `TEST_URL`.

## Primeiro acesso

Após criar uma conta, `/boas-vindas.html` orienta a configuração inicial: área de atuação, nome, telefone, horários e fuso. O consultório e a agenda são criados na mesma transação. Contas com consultório cadastrado entram diretamente no painel. Os primeiros passos acompanham os cadastros e podem ser recolhidos. A página pública continua separada da administração, e suas cores são escolhidas em Aparência da página.

## Perfil e privacidade

Meu perfil abre em Informações, com dados pessoais e profissionais. CPF, nascimento, gênero e imagem de assinatura ficam na tabela privada `manu_private_profiles`, acessível apenas pela própria conta; não são retornados pela API pública do consultório. O salvamento dos dados pessoais e profissionais ocorre na mesma transação, com verificação de versões.

O menu do perfil inclui informações, assinatura profissional, sobre mim, contato e endereço, procedimentos, horários, limite de agendamentos, página pública e segurança da conta. A imagem de assinatura é apenas um cadastro privado: não certifica nem assina documentos. A troca de senha exige a senha atual e encerra as outras sessões. Limites diários configurados também são verificados no backend.

## Atendimento simultâneo

Em Meu perfil → Limite de Agendamentos, o profissional pode herdar a capacidade padrão do consultório, escolher de 1 a 20 pacientes simultâneos ou permitir sobreposição sem limite fixo mediante confirmação explícita. A capacidade padrão permanece em 1 para agendas existentes. O limite diário continua sendo uma configuração separada. O backend calcula a concorrência real por intervalo, considera o fim de uma consulta disponível para a próxima e exige confirmação em sobreposições sem limite.

## Publicação da página profissional

Novos consultórios começam com a página pública desativada. Em Meu perfil → Página Pública, o responsável ativa ou desativa a publicação e salva as alterações. O endereço público retorna 404 enquanto desativado. A prévia usa um endpoint autenticado, restrito ao proprietário, e respeita as escolhas de visibilidade dos contatos. Cadastros anteriores sem a nova configuração mantêm sua publicação anterior.

## Segurança da conta

A tela de segurança informa claramente que a verificação por e-mail, a verificação em duas etapas e a confiança em dispositivos ainda não estão implementadas. Essas opções não são apresentadas como ativas. A troca de senha funciona e invalida as outras sessões. A conta pode listar as próprias sessões abertas, encerrar uma delas ou todas as outras. IDs de sessão públicos não são os tokens de autenticação; os tokens continuam em cookie HttpOnly e no banco somente como hash.

As migrações acrescentam identificador, data de criação e descrição do navegador às sessões. Sessões antigas sem esses metadados são identificadas sem inventar uma data de início.
