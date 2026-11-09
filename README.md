# Manu Saúde

Plataforma de consultórios online com Node.js 22, Express e PostgreSQL 17.

## Funcionalidades

Cadastro e login com senhas protegidas por scrypt, sessões em cookie HttpOnly, acesso privado por proprietário, página pública do consultório, perfil com logo/foto, pacientes, agenda diária, calendário mensal compacto e catálogo de serviços. A gravação no banco verifica a versão dos dados para evitar sobrescrever alterações simultâneas e respeita a capacidade simultânea e rejeita novas consultas fora dos horários de atendimento.

A recuperação de senha por e-mail, verificação de e-mail, assinaturas, cobrança, reserva pública automática e respostas automáticas pelo WhatsApp ainda não estão habilitadas. O profissional já pode conectar o próprio WhatsApp e receber as mensagens dos pacientes no painel (veja "WhatsApp do consultório"). O botão de WhatsApp de cada consulta abre uma mensagem para envio manual.

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

## Termos de uso e Política de privacidade

As páginas `/termos` e `/privacidade` são geradas a partir de `legal/termos.html` e `legal/privacidade.html`. Os dados do responsável pela plataforma vêm do ambiente:

- `LEGAL_NAME`: nome ou razão social do responsável (ex.: `Manu Digital Ltda.`).
- `LEGAL_DOC`: CNPJ ou CPF (opcional, mas recomendado), ex.: `CNPJ 00.000.000/0001-00`.
- `LEGAL_EMAIL`: e-mail para pedidos de privacidade e exclusão de conta.
- `LEGAL_CITY`: cidade do foro (ex.: `Miranda/MS`).

Sem essas variáveis, as páginas mostram **"a informar"** no lugar.

O cadastro exige marcar "Li e aceito". A versão aceita (`TERMS_VERSION` em `server.js`) e a data ficam em `manu_users`. Contas antigas, ou contas que aceitaram uma versão anterior, veem uma faixa no painel para aceitar. **Ao mudar o texto de forma importante, altere `TERMS_VERSION`**: todos precisarão aceitar de novo. No primeiro contato pelo menu do WhatsApp, o paciente recebe o link da política de privacidade (quando `APP_URL` está definido).

Os textos foram escritos a partir do funcionamento real da plataforma, mas **não substituem a revisão de um advogado**.

## Recuperar senha

Em `/conta.html`, **Esqueci minha senha** pede o e-mail. O sistema manda um **código de 6 números** para o **WhatsApp do consultório** (campo WhatsApp do perfil), a partir do **número da plataforma**:

- `EVOLUTION_INSTANCE`: nome da instância da Evolution usada para avisos da plataforma (por exemplo `Manu - Saude`). Precisa estar conectada.

O código vale **15 minutos**, aceita **5 tentativas**, só pode ser usado uma vez e não é reenviado antes de 60 segundos. A resposta da tela é sempre a mesma, exista o e-mail ou não. Ao criar a senha nova, **todas as sessões abertas são encerradas** e o profissional já entra logado. Os códigos ficam só como hash em `manu_password_resets`. Sem `EVOLUTION_INSTANCE`, nada é enviado e o log registra o motivo. A tela indica o `LEGAL_EMAIL` para suporte.

## WhatsApp do consultório

Cada profissional conecta o **próprio número** em Meu WhatsApp, lendo um código QR com o celular. A conexão usa uma **Evolution API** (pode ser a mesma do Easypanel): o Manu Saúde cria uma instância `manu-<id do consultório>` para cada consultório e configura o webhook sozinho.

No serviço da aplicação, configure:

- `EVOLUTION_URL`: endereço da Evolution API, sem barra no final.
- `EVOLUTION_APIKEY`: a chave global da Evolution (`AUTHENTICATION_API_KEY` dela). Não envie ao GitHub.
- `APP_URL`: endereço HTTPS público do Manu Saúde, sem barra final. A Evolution usa esse endereço para entregar as mensagens.

O webhook fica em `/webhook/whatsapp/<consultório>/<segredo>`; o segredo é gerado a cada conexão e só o hash fica no banco. Mensagens de grupos são ignoradas. As mensagens (texto e o tipo de mídia: áudio, imagem, documento) ficam na tabela `manu_whatsapp_messages` e aparecem só para o dono do consultório. São dados de saúde: mantenha backups protegidos.

### Atendimento automático por menu

Em Meu WhatsApp, o profissional liga **Atendimento automático por menu**. Quem mandar mensagem recebe um menu numerado:

1. **Agendar consulta**: escolhe o serviço (pulado se houver só um), o dia (próximos dias com vaga), o horário, a modalidade (se o consultório atende presencial e online) e informa o nome se ainda não for paciente. A consulta entra na agenda como **Agendada**, com a etiqueta "Agendado pelo WhatsApp".
2. **Ver ou cancelar meu horário**: lista as próximas consultas do número (o paciente é reconhecido pelo telefone, com ou sem 55 e nono dígito) e permite cancelar.
3. **Falar com o profissional**: pausa o atendimento automático para essa pessoa pelo tempo escolhido (30 minutos, 2 horas ou 12 horas; padrão 2 horas).

Os horários usam as mesmas regras da agenda e da página pública: dias e horários de atendimento, capacidade, limite diário e fuso do consultório. A marcação é conferida de novo dentro de uma transação, então dois pacientes não ficam com a última vaga.

Se o profissional responder um paciente pelo próprio celular, o atendimento automático pausa com aquela pessoa pelo mesmo tempo escolhido em Meu WhatsApp. Desligar e ligar de novo o atendimento automático desfaz todas as pausas. Uma conversa parada por 30 minutos recomeça do menu. Áudios e imagens ainda não são entendidos: o paciente recebe o menu. O estado de cada conversa fica em `manu_whatsapp_sessions`.

## Desenvolvimento e testes

```sh
npm ci
# Defina as variáveis PG* para um PostgreSQL local de testes.
PORT=18080 NODE_ENV=test EVOLUTION_URL=http://127.0.0.1:18091 EVOLUTION_APIKEY=teste-evolution EVOLUTION_INSTANCE=plataforma npm start
# Em outro terminal:
npm test
```

`npm test` roda testes de integração contra `http://127.0.0.1:18080`. Use exclusivamente banco descartável: os testes criam contas e consultórios fictícios. Para outro endereço, configure `TEST_URL`. O teste do WhatsApp sobe uma Evolution falsa na porta 18091; se o servidor for iniciado sem `EVOLUTION_URL`, essa parte é pulada.

## Primeiro acesso

Após criar uma conta, `/boas-vindas.html` orienta a configuração inicial: área de atuação, nome, telefone, horários e fuso (Brasília, Campo Grande/Cuiabá, Manaus, Rio Branco ou Noronha). O consultório e a agenda são criados na mesma transação. Contas com consultório cadastrado entram diretamente no painel. Os primeiros passos acompanham os cadastros e podem ser recolhidos. A página pública continua separada da administração, e suas cores são escolhidas em Aparência da página.

## Perfil e privacidade

Meu perfil abre em Informações, com nome, fuso horário e dados profissionais. **CPF, data de nascimento, gênero e imagem de assinatura não são coletados** (LGPD: a plataforma só guarda o que usa). Ao iniciar, o servidor apaga esses dados de cadastros antigos na tabela `manu_private_profiles`, que permanece vazia por compatibilidade. O salvamento do perfil continua verificando versões.

O menu do perfil inclui informações, sobre mim, contato e endereço, procedimentos, horários, página pública e segurança da conta; o limite de agendamentos fica em Opções avançadas. A troca de senha exige a senha atual e encerra as outras sessões. Limites diários configurados também são verificados no backend.

## Atendimento simultâneo

Em Meu consultório → Opções avançadas: grupos e limites (fechado por padrão), o profissional pode escolher de 1 a 20 pacientes simultâneos ou 0 para permitir sobreposição sem limite fixo, mediante confirmação explícita. A capacidade padrão permanece em 1 para agendas existentes. O limite diário continua sendo uma configuração separada. O backend calcula a concorrência real por intervalo, considera o fim de uma consulta disponível para a próxima e exige confirmação em sobreposições sem limite.

## Publicação da página profissional

Novos consultórios começam com a página pública desativada. Em Meu perfil → Página Pública, o responsável ativa ou desativa a publicação e salva as alterações. O endereço público retorna 404 enquanto desativado. A prévia usa um endpoint autenticado, restrito ao proprietário, e respeita as escolhas de visibilidade dos contatos. Cadastros anteriores sem a nova configuração mantêm sua publicação anterior.

## Segurança da conta

A tela de segurança informa claramente que a verificação por e-mail, a verificação em duas etapas e a confiança em dispositivos ainda não estão implementadas. Essas opções não são apresentadas como ativas. A troca de senha funciona e invalida as outras sessões. A conta pode listar as próprias sessões abertas, encerrar uma delas ou todas as outras. IDs de sessão públicos não são os tokens de autenticação; os tokens continuam em cookie HttpOnly e no banco somente como hash.

As migrações acrescentam identificador, data de criação e descrição do navegador às sessões. Sessões antigas sem esses metadados são identificadas sem inventar uma data de início.
