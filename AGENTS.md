# Instruções para agentes (Codex, Claude Code e outros)

Este arquivo vale para **qualquer agente de IA** que trabalhe neste repositório.
O `CLAUDE.md` só importa este arquivo, então mantenha as regras **aqui**.

## O projeto

**Manu Saúde**: plataforma de consultórios online. O profissional cria conta, cadastra o consultório,
publica uma página pública, gerencia pacientes, serviços e agenda, e recebe pedidos de agendamento.
Detalhes de funcionamento no `README.md`.

| Arquivo / pasta | O que é |
|---|---|
| `server.js` | Todo o back-end: Express 5 + Postgres (`pg`), API, sessões, criação das tabelas `manu_*` |
| `public/` | Front-end sem framework e sem build (HTML, CSS e JS puros) |
| `test/` | Testes de integração com `node:test`, contra o servidor rodando |
| `Dockerfile`, `deploy/` | Deploy no Easypanel (porta interna **8080**) |

Node 22, ES modules (`"type": "module"`). Dependências: só `express` e `pg`.
**Não adicione bibliotecas ou frameworks sem pedir ao dono.**

## Comandos

```bash
npm ci
# terminal 1: servidor apontando para um Postgres DESCARTÁVEL
PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres PGDATABASE=manutest PORT=18080 NODE_ENV=test \
  EVOLUTION_URL=http://127.0.0.1:18091 EVOLUTION_APIKEY=teste-evolution EVOLUTION_INSTANCE=plataforma npm start
# terminal 2:
npm test        # testes de integração em http://127.0.0.1:18080 (ou TEST_URL)
```

- Os testes **precisam** do servidor no ar e de um banco Postgres. Sem isso, todos falham.
- Os testes criam contas e consultórios fictícios: **nunca** rode contra o banco de produção.
- O servidor cria as tabelas sozinho ao iniciar.
- O teste do WhatsApp sobe uma Evolution falsa na porta 18091 (por isso as variáveis `EVOLUTION_*` acima).
  Nunca aponte os testes para a Evolution de verdade.
- Rodar a suíte várias vezes no mesmo banco esbarra no limite de cadastros por IP (429): recrie o banco de teste.

Antes de abrir um PR: `npm test` passando com o servidor local.

## Regras do código

- **Estilo:** `server.js` usa um estilo compacto (funções em uma linha). Siga o estilo do arquivo; não
  reformate o arquivo inteiro num PR de funcionalidade.
- **Idioma:** textos para o usuário em **português do Brasil**. Mensagens de commit e PRs em português.
- **Banco:** só tabelas com prefixo `manu_`. Mudanças de estrutura entram como SQL idempotente na criação
  do banco em `server.js` (`CREATE ... IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). Nunca apague dados.
- **Concorrência:** gravações conferem a versão dos dados (`_version`) para não sobrescrever alterações
  simultâneas. Preserve essa checagem.
- **Agenda:** respeite capacidade simultânea, horários de atendimento e o fuso do consultório
  (`profile.timezone`, padrão `America/Sao_Paulo`). Nunca use o relógio/fuso do servidor para "hoje".
- **Privacidade:** cada consultório só é acessível ao seu proprietário; dados de pacientes são sensíveis
  (LGPD). Toda rota privada confere a sessão e o dono **no servidor**.
- **Senhas:** scrypt, cookie `HttpOnly`. Não troque o mecanismo sem pedir.
- Funcionalidades que o `README.md` diz que **ainda não existem** (e-mail, cobrança, WhatsApp automático)
  não devem ser anunciadas na interface como se funcionassem.
- Regra nova ou correção de bug: **adicione um teste** em `test/`.

## Fluxo de trabalho (equipe: dono + Claude Code + Codex)

- **Nunca** faça push direto na `main`. A `main` é publicada automaticamente pelo Easypanel.
- Uma tarefa = uma branch (`feat/...`, `fix/...`) = um Pull Request pequeno.
- Descreva no PR, em português simples: **o que mudou, por que, e como o dono pode testar**.
- Se a mudança exigir ação manual (variável nova no Easypanel), escreva isso em destaque no PR.
- Quem não fez a tarefa revisa o PR (`@codex review` no GitHub, ou pedir ao Claude Code). O dono faz o merge.
- **Segredos:** nunca colocar senhas do banco, chaves ou tokens no código, em exemplos ou em PRs.
  Tudo vem de variáveis de ambiente (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `APP_URL`).
