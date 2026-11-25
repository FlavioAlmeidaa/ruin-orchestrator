# Documento de Escopo: Ruin Orchestrator
**Orquestrador de Agentes de IA Self-Hosted com Interface Gamificada**

---

## 1. Visão Geral do Projeto

O **Ruin Orchestrator** é uma plataforma *self-hosted* de orquestração de múltiplos agentes de Inteligência Artificial projetada para transformar o monitoramento e a execução de fluxos de trabalho (*workflows*) em uma experiência visual, intuitiva e interativa.

Em vez de dashboards corporativos tradicionais ou terminais extensos de texto, o sistema apresenta um **mundo isométrico em pixel art** ambientado em uma cidade pós-apocalíptica tomada pela selva. Cada agente de IA é representado por um **robô autônomo** cuja missão é restaurar as ruínas da cidade — onde cada tarefa concluída literalmente reconstrói uma estrutura do mapa.

### Objetivos Principais
* **Observabilidade Intuitiva:** Permitir identificar visualmente, em segundos, qual agente está trabalhando, qual ferramenta está usando, quanto de contexto/custo está consumindo e onde ocorreram erros.
* **Controle Total (Self-Hosted):** Rodar localmente ou em servidor próprio via Docker, com liberdade para usar APIs externas (Gemini, OpenAI, Anthropic) ou modelos locais (Ollama) sem aprisionamento tecnológico.
* **Extensibilidade:** Suportar a adição de novas capacidades aos agentes de forma modular (como ferramentas nativas e servidores MCP).

---

## 2. Conceito Visual e Mecânicas de Gamificação

A interface combina um **mapa isométrico 2D em pixel art** com uma **HUD de RPG** estilizada (estética de monitores antigos tomados por vegetação).

### Mapeamento: Orquestração de IA → Mundo do Jogo

| Elemento Técnico (IA) | Representação no Jogo (UI / Mapa) |
| :--- | :--- |
| **Agentes (LLMs)** | **Unidades Robóticas** com classes distintas (ex: *Explorador* para pesquisa, *Construtor* para código, *Inspetor* para revisão). |
| **Workflow / Projeto** | **Setor da Cidade** (um mapa isométrico em ruínas com percentual global de restauração). |
| **Tarefa / Sub-tarefa** | **Construção no Mapa** (ex: *Torre de Dados*, *Gerador Solar*, *Oficina*) com 3 estados visuais: `Ruína` → `Em Obra` → `Restaurada`. |
| **Tools / MCPs** | **Módulos Equipados** na HUD do robô. O uso de uma ferramenta dispara animações específicas no mapa (scanner, solda, transmissão). |
| **Tokens / Custo** | **Célula de Energia (Bateria / Mana)** exibida em tempo real na barra do agente. |
| **Logs de Execução** | **Combat Log** no canto da tela, exibindo o *streaming* de raciocínio, chamadas de ferramentas e resultados. |
| **Erros / Timeouts** | **Curto-Circuito / Fumaça** no sprite do robô, sinalizando necessidade de *retry* automático ou intervenção humana. |
| **Conclusão sem Erros** | **XP e Integridade**, registrando métricas de eficiência histórica por perfil de agente. |

---

## 3. Arquitetura Técnica e Stack

O sistema é dividido em um monorepo desacoplado, onde o backend gerencia a inteligência e emite eventos em tempo real, enquanto o frontend apenas reage a esses eventos.

* **Backend (Engine de Orquestração):**
  * **Runtime:** Bun + TypeScript.
  * **Comunicação em Tempo Real:** WebSockets nativos (`Bun.serve`) usando um contrato de eventos tipado (`shared/events.ts`).
  * **Camada de IA:** Vercel AI SDK (suporte unificado a provedores em nuvem e modelos locais via Ollama) + suporte a MCP (*Model Context Protocol*).
  * **Persistência:** SQLite (`bun:sqlite`) para histórico de execuções, logs, métricas de tokens e estado dos setores.
* **Frontend (Mundo + HUD):**
  * **Framework:** React + TypeScript (Vite).
  * **Camada 1 — Mapa Isométrico:** PixiJS v8 renderizado em `<canvas>` com projeção 2:1, `roundPixels: true` e `image-rendering: pixelated`.
  * **Camada 2 — HUD de RPG:** Componentes React sobrepostos ao canvas com animações fluidas de barras, transições e feedbacks visuais via GSAP.
* **Infraestrutura:**
  * **Containerização:** Docker e Docker Compose para subir backend, frontend e (opcionalmente) instância local do Ollama com um único comando.

---

## 4. Escopo Funcional (O que faz parte do projeto)

### 4.1. Motor de Orquestração (Backend)
* Cadastro e configuração de agentes (nome, classe, *system prompt*, modelo de LLM e limite de tokens).
* Execução de tarefas simples e encadeadas (ex: Agente A gera → Agente B revisa).
* Sistema de *tool calling* com emissão de eventos em tempo real a cada passo da execução.
* Gerenciamento de fila de tarefas (*quests*) e tratamento de falhas com opção de *retry*.

### 4.2. Mundo Isométrico (PixiJS)
* Grid isométrico navegável com suporte a zoom/pan mantendo a nitidez de pixel art.
* Movimentação de robôs entre tiles (com *pathfinding* simples, como A*) até a construção designada.
* Mudança visual dinâmica das construções conforme o progresso da tarefa (`ruined` → `constructing` → `restored`).
* Efeitos visuais de estado nos robôs (ocioso, caminhando, executando *tool*, erro).

### 4.3. HUD de RPG (React + GSAP)
* **Painel de Despacho de Quests:** Formulário rápido para enviar prompts e escolher qual estrutura/fluxo iniciar.
* **Inspector do Robô:** Ao clicar em um agente no mapa, exibe retrato, barra de energia (tokens), status atual e módulos (tools) equipados.
* **Combat Log:** Terminal retrô com filtro por agente, mostrando o *stream* de eventos e resultados finais copiáveis.
* **Barra de Restauração do Setor:** Indicador global do progresso das tarefas do projeto atual.

---

## 5. Fora de Escopo (Não-Objetivos Iniciais)

Para manter o projeto enxuto e viável, os seguintes itens **não** fazem parte do escopo inicial:
* Mecânicas de combate tradicional, inimigos controlados por IA ou sistema de *Game Over* punitivo.
* Modo multiplayer online, contas multi-tenant complexas ou sistema de permissões corporativas (RBAC).
* Editor de mapas completo estilo *tilemap builder* integrado à interface.
* Suporte a renderização 3D (o foco exclusivo é pixel art isométrico 2D).

---

## 6. Roadmap de Desenvolvimento

### Fase 1 — Fundação e Greyboxing (MVP Técnico)
* Estruturação do monorepo (`shared`, `backend`, `frontend`).
* Contrato de eventos WebSocket funcionando ponta a ponta.
* Grid isométrico básico em PixiJS usando formas geométricas simples (*greyboxing*) e *Combat Log* funcional.

### Fase 2 — Motor Real de IA e Persistência
* Integração com o Vercel AI SDK (Gemini / Ollama) substituindo os fluxos simulados.
* Implementação das primeiras ferramentas reais (*tools*) e persistência de histórico/estado em SQLite.
* Adição de movimentação interpolada (GSAP / *pathfinding*) dos robôs pelo mapa.

### Fase 3 — HUD de RPG Completa e Experiência de Uso
* Construção dos painéis de inspeção de agentes, medidores de tokens (Energia) e barra de progresso do setor.
* Interface para criar/editar agentes e despachar fluxos multi-agentes diretamente pela HUD.
* Tratamento visual de erros (*curto-circuito*) com botão de reparo (*retry*) manual.

### Fase 4 — Arte Pixel Art e Empacotamento Self-Hosted
* Substituição dos blocos de *greyboxing* por spritesheets reais em pixel art (chão, vegetação, ruínas, obras, prédios restaurados e animações dos robôs).
* Criação do `docker-compose.yml` e documentação final de instalação e uso.

---

## 7. Critérios de Sucesso

O projeto será considerado bem-sucedido quando:
1. For possível subir toda a aplicação localmente com um único comando (`docker compose up`).
2. Um usuário conseguir despachar uma tarefa real via HUD, acompanhar visualmente o robô se deslocar e usar ferramentas no mapa isométrico, e receber o resultado útil gerado pelo LLM no *Combat Log*.
3. A arquitetura permitir trocar o modelo de IA ou adicionar uma nova ferramenta no backend sem exigir alterações na lógica de renderização do mapa.