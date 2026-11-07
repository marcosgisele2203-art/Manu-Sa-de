# Manu Saúde

Plataforma em desenvolvimento para profissionais de saúde terem seu consultório online.

## Estado atual

Demonstração funcional em HTML, CSS e JavaScript. Inclui perfil personalizado, logo e foto, painel do profissional, calendário mensal, consultas, pacientes e configurações de atendimento.

**Ainda não é um sistema para dados reais de pacientes.** Os dados ficam no localStorage do navegador, sem autenticação, base compartilhada, cobrança ou automação de WhatsApp. Publicar em outro domínio não transfere os dados salvos no domínio anterior.

## Implantar no EasyPanel

1. Conecte sua conta GitHub ao EasyPanel e autorize o repositório privado escolhido.
2. Crie um projeto `manu-saude` e um serviço do tipo **App**.
3. Em **Source / Origem**, escolha GitHub, o repositório e a branch `main`. Use a raiz do repositório como contexto.
4. Em **Build / Compilação**, escolha **Dockerfile**, caminho `Dockerfile`.
5. Configure a porta interna como **8080** (HTTP).
6. Gere primeiro o endereço de teste do EasyPanel ou adicione seu domínio e ative HTTPS.
7. Implante e confira `/healthz`, `/` e `/painel.html?consultorio=exemplo-ana`.
8. Se desejar atualização a cada push, habilite o auto deploy do EasyPanel para esta branch.

Não são necessárias variáveis de ambiente ou volumes para esta demonstração. Não salve tokens, senhas ou arquivos `.env` no repositório. O código de frontend é público para quem acessa o site, inclusive se o repositório for privado.

## Teste local com Docker

```sh
docker build -t manu-saude .
docker run --rm -p 8080:8080 manu-saude
```

Abra `http://localhost:8080`.

## Próxima etapa para produção

Adicionar backend com autenticação e autorização por consultório, PostgreSQL com isolamento dos dados, armazenamento de imagens, agendamento público com controle de concorrência, backups e auditoria. A aplicação e o PostgreSQL poderão ser serviços separados no EasyPanel. O WhatsApp será uma integração no backend, com credenciais armazenadas no gerenciador de variáveis do EasyPanel.
