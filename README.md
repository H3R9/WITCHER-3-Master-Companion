<div align="center">
<img 
  src="https://github.com/user-attachments/assets/7768989a-0496-4d3f-911e-1b5c2ab216d1"
  alt="Witcher 3 Master Companion Banner"
  title="Witcher 3 Master Companion Banner"
  width="100%"
  style="border-radius: 10px; margin-bottom: 20px; transform: scaleX(-1);"
  loading="lazy"
/>

  <h1>🐺 Witcher 3 Master Companion</h1>
  <p><strong>O seu guia definitivo, alimentado por Inteligência Artificial, para dominar o Continente.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  </p>
</div>

<br/>

O **Witcher 3 Master Companion** é uma aplicação web interativa projetada para auxiliar jogadores de *The Witcher 3: Wild Hunt (Next-Gen Edition)*. Utilizando a poderosa API do Google Gemini, o app analisa capturas de tela do seu jogo (inventário, missões, bestiário, cartas de Gwent) e fornece estratégias personalizadas, rotas otimizadas e dicas valiosas baseadas no seu nível e localização atual.

---

## ✨ Funcionalidades Principais

### 📜 Mestre de Missões (Quest Master)
Envie prints do seu log de missões e a IA criará o **Caminho do Destino**, uma linha do tempo visual com a ordem exata das missões que você deve fazer.
- Evita que você perca missões secundárias importantes.
- Prioriza missões baseadas no seu nível para maximizar o ganho de XP.
- **Exportação HTML:** Salve seu Caminho do Destino em um arquivo HTML estilizado para consultar offline.

### 💰 Mestre Mercador (Merchant Master)
Não sabe o que vender, desmontar ou guardar?
- Analisa seu inventário e diz exatamente para qual mercador vender cada item para obter o maior lucro.
- Avisa se você deve guardar um item para um mercador melhor em outra região (ex: Novigrad ou Toussaint).

### 🃏 Estrategista de Gwent (Gwent Strategist)
Torne-se o campeão do Continente.
- Analisa suas cartas disponíveis e monta o melhor baralho possível.
- Sugere a melhor carta de Líder e fornece estratégias detalhadas rodada a rodada.

### 💀 Mestre do Bestiário (Bestiary Master)
Conheça seu inimigo antes de sacar a espada de prata.
- Gera uma **Matriz de Vulnerabilidade** visual mostrando exatamente quais Óleos, Sinais, Bombas e Poções usar.
- Fornece dicas de combate, lore e lista de possíveis *loots* (saques).

### ⚔️ Mestre Armeiro (Gear Master)
Otimize seu equipamento de Bruxo.
- Analisa diagramas e peças de armadura das Escolas (Lobo, Gato, Grifo, Urso, etc.).
- Mostra um infográfico da composição do seu set e sugere a melhor *build* (Sinais, Ataque Rápido, Alquimia) para ele.

### 🔍 Mestre Rastreador (Finder Master)
Precisa de um item específico e não sabe onde achar?
- Digite o nome do item, seu nível e localização.
- A IA fornecerá um guia passo a passo, locais exatos de *farm* e alternativas viáveis caso o item seja de nível muito alto.

---

## 📸 Capturas de Tela

*(Substitua estas imagens por capturas de tela reais da sua aplicação)*

<div align="center">
  <img src="https://placehold.co/600x350/1a1a1a/c5a059?text=Menu+Principal" width="48%" alt="Menu Principal"/>
  <img src="https://placehold.co/600x350/1a1a1a/c5a059?text=Dashboard+de+Missoes" width="48%" alt="Dashboard de Missões"/>
</div>
<br/>
<div align="center">
  <img src="https://placehold.co/600x350/1a1a1a/c5a059?text=Matriz+de+Vulnerabilidade" width="48%" alt="Bestiário"/>
  <img src="https://placehold.co/600x350/1a1a1a/c5a059?text=Exportacao+HTML" width="48%" alt="Exportação HTML"/>
</div>

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS
- **Animações:** Framer Motion (`motion/react`)
- **Ícones:** Lucide React
- **Inteligência Artificial:** Google Gemini API (`@google/genai`) - Modelos *Gemini 3.1 Pro Preview* e *Gemini 3.1 Flash Preview* (para OCR).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js (v18 ou superior)
- NPM ou Yarn
- Uma chave de API do Google Gemini ([Obtenha aqui](https://aistudio.google.com/))

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/H3R9/WITCHER-3-Master-Companion.git
   cd WITCHER-3-Master-Companion
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as Variáveis de Ambiente:
   Crie um arquivo `.env` na raiz do projeto e adicione sua chave de API do Gemini:
   ```env
   GEMINI_API_KEY=sua_chave_de_api_aqui
   ```
   *(Nota: Se estiver rodando no Google AI Studio, a chave já é injetada automaticamente no ambiente).*

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Abra o navegador em `http://localhost:3000` (ou a porta indicada no terminal).

---

## 🎨 Design e UI/UX

A interface foi construída para ser altamente imersiva, utilizando:
- **Tipografia:** `Cinzel` para títulos (trazendo o ar épico e medieval) e `Inter` para legibilidade.
- **Paleta de Cores:** Focada em tons escuros (Dark Mode nativo) com destaques em "Witcher Gold" (`#c5a059`) e vermelho sangue para alertas.
- **Efeitos:** Partículas de brasas flutuantes, neblina animada, vinhetas e texturas de pergaminho para os painéis de leitura.

---

## 🤝 Como Contribuir

Contribuições são sempre bem-vindas! Se você tem ideias para novas funcionalidades, correções de bugs ou melhorias na IA:

1. Faça um *Fork* do projeto.
2. Crie uma *Branch* para sua feature (`git checkout -b feature/NovaFuncionalidade`).
3. Faça o *Commit* de suas mudanças (`git commit -m 'Adicionando nova funcionalidade incrível'`).
4. Faça o *Push* para a Branch (`git push origin feature/NovaFuncionalidade`).
5. Abra um **Pull Request**.

---

## 📜 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p><i>"O destino é uma espada de dois gumes... e eu sou um dos gumes."</i></p>
  <p>Desenvolvido com ⚔️ e magia.</p>
</div>
