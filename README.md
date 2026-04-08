# 🐺 Witcher 3 Quest Master - Next-Gen

Um companheiro avançado e inteligente para **The Witcher 3: Wild Hunt**, alimentado por Inteligência Artificial para ajudar você a tomar as melhores decisões no Continente.

## ✨ Funcionalidades

*   **👤 Perfil do Bruxo (Cloud Sync):** Salve seu progresso na nuvem de forma segura com Firebase e Google Login. Mantenha seu Nível, Coroas, Localização Atual e Regiões Desbloqueadas sempre sincronizados.
*   **📜 Mestre de Missões:** Envie prints do seu diário de missões. A IA lê as missões usando OCR avançado, sugere a melhor ordem de resolução e avisa sobre consequências (com controle de tolerância a spoilers!).
*   **💰 Mestre Mercador:** Tire foto do seu inventário e descubra o que vender, o que guardar e para qual mercador específico vender para obter o maior lucro.
*   **⚔️ Mestre Armeiro:** Analise seus equipamentos e diagramas. Receba recomendações do que craftar com base no seu nível atual e dinheiro disponível.
*   **🃏 Estrategista de Gwent:** Escaneie suas cartas e receba dicas de montagem de deck e estratégias para derrotar qualquer oponente.
*   **💀 Mestre do Bestiário:** Encontrou um monstro desconhecido? Envie uma print e descubra suas fraquezas, poções recomendadas e táticas de combate.
*   **🔍 Mestre Rastreador:** Busque por qualquer item, material ou armadura. A IA criará um guia passo a passo de como obtê-lo, respeitando as regiões que você já desbloqueou.

## 🚀 Tecnologias Utilizadas

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Animações), Lucide React (Ícones).
*   **Inteligência Artificial:** Google Gemini API (`gemini-3.1-pro-preview`) com *Google Search Grounding* para OCR de alta precisão, leitura de imagens borradas e conhecimento profundo e atualizado do jogo.
*   **Backend & Banco de Dados:** Firebase Authentication (Google Login) e Firebase Firestore (com Regras de Segurança rigorosas para proteção de dados).

## 🛠️ Como Executar Localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente. Você precisará de uma chave da API do Gemini e das configurações do Firebase:
   * Crie um arquivo `.env` na raiz do projeto:
     ```env
     GEMINI_API_KEY=sua_chave_aqui
     ```
   * Configure o Firebase no arquivo `firebase-applet-config.json`.
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🛡️ Segurança e Privacidade

Seus dados de perfil são protegidos por **Firestore Security Rules**. Apenas você, autenticado via Google, tem acesso de leitura e escrita ao seu próprio documento de progresso. O sistema valida rigorosamente os dados para evitar corrompimento do seu save na nuvem.

---
*Boa caçada no Caminho!* ⚔️
