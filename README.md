# Manu Saúde

Plataforma de consultórios online com Node.js 22, Express e PostgreSQL 17.

## Funcionalidades

Cadastro e login com senhas protegidas por scrypt, sessões em cookie HttpOnly, acesso privado por proprietário, página pública do consultório, perfil com logo/foto, pacientes, agenda diária, calendário mensal compacto e catálogo de serviços. A gravação no banco verifica a versão dos dados para evitar sobrescrever alterações simultâneas e rejeita consultas sobrepostas ou novas consultas fora dos horários de atendimento.

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
