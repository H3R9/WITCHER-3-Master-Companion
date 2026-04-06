# Política de Segurança

A segurança é uma prioridade para o projeto **Witcher 3 Master Companion**. Levamos a sério a proteção dos dados dos usuários e a integridade da aplicação.

## Versões Suportadas

Atualmente, apenas a versão mais recente (branch `main`) recebe atualizações de segurança. Recomendamos que você sempre mantenha seu repositório local sincronizado com a versão mais recente.

| Versão | Suportada |
| :--- | :--- |
| `main` (Latest) | ✅ Sim |
| Versões Anteriores | ❌ Não |

## Tratamento de Chaves de API (Google Gemini)

Como este aplicativo utiliza a API do Google Gemini para processar imagens e gerar análises:

1. **Armazenamento Local:** A chave da API (`GEMINI_API_KEY`) deve ser configurada apenas no seu arquivo `.env` local.
2. **Não Comite Chaves:** O arquivo `.env` está incluído no `.gitignore` por padrão. **Nunca** faça o commit da sua chave de API para o GitHub ou qualquer outro repositório público.
3. **Uso no Cliente/Servidor:** As requisições para a API são feitas a partir do ambiente em que o aplicativo está rodando. Se você hospedar este aplicativo publicamente, certifique-se de proteger sua chave de API usando variáveis de ambiente no seu provedor de hospedagem (ex: Vercel, Netlify, Cloud Run) e restrinja o uso da chave no painel do Google Cloud.

## Como Reportar uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança neste projeto, por favor, **não a divulgue publicamente** criando uma *Issue* pública.

Em vez disso, pedimos que você reporte o problema diretamente para o mantenedor do projeto através do e-mail:
📧 **igor1862004@gmail.com**

Por favor, inclua no seu e-mail:
* Uma descrição detalhada da vulnerabilidade.
* Os passos para reproduzir o problema.
* (Opcional) Sugestões de como corrigir a vulnerabilidade.

Tentaremos responder ao seu relato o mais rápido possível (geralmente em até 48 horas) para confirmar o recebimento e discutir os próximos passos para a correção.

---

Agradecemos por ajudar a manter o **Witcher 3 Master Companion** seguro para todos os bruxos do Continente!
