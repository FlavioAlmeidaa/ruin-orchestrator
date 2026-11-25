# Ruin Orchestrator

> **Orquestrador de Agentes de IA Self-Hosted com Interface Gamificada e Mundo Isométrico em Pixel Art.**

O **Ruin Orchestrator** transforma o monitoramento e despacho de múltiplos agentes de IA em um ambiente isométrico interativo. Em vez de telas áridas de texto, autômatos cognitivos percorrem setores de uma cidade pós-apocalíptica tomada pela selva, executando diagnósticos, sínteses e soldas para reconstruir ruínas em estruturas funcionais.

---

## 🛠️ Stack Tecnológica

- **Backend:** [Bun](https://bun.sh/) + TypeScript + WebSockets nativos + SQLite (`bun:sqlite`).
- **Camada de IA:** [Vercel AI SDK](https://sdk.vercel.ai/) com suporte a **Google Gemini**, **Ollama local** e fallback autônomo de alta fidelidade para execução offline.
- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [PixiJS v8](https://pixijs.com/) (renderização isométrica com Pan & Zoom) + [GSAP](https://gsap.com/) para animações da HUD retrô.
- **Contrato de Tipos:** Monorepo desacoplado com tipos compartilhados em `shared/events.ts`.
- **Deploy:** `docker-compose.yml` para subida com comando único.

---

## 🚀 Como Executar Localmente

### Opção 1: Desenvolvimento com Bun (Recomendado)

1. **Inicie o Backend:**
   ```bash
   cd backend
   bun run src/index.ts
   # ou com hot reload:
   bun dev
   ```

2. **Inicie o Frontend:**
   ```bash
   cd frontend
   bun dev
   ```
   Acesse no navegador: `http://localhost:5173`.

### Opção 2: Docker Compose (Self-Hosted Completo)

```bash
docker compose up --build
```

---

## 🧠 Configuração de IA (Opcional)

Crie um arquivo `.env` na raiz ou no diretório `backend/` caso deseje utilizar modelos em nuvem ou locais:

```env
# Exemplo com Google Gemini:
GEMINI_API_KEY=sua_chave_aqui

# Ou com Ollama:
OLLAMA_HOST=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2
```

> **Nota:** Se nenhuma chave for informada, o sistema aciona automaticamente o protocolo autônomo de simulação em tempo real com execução completa de ferramentas, animações e persistência em SQLite.

---

## 🎮 Controles da Interface

- **Arrastar Mapa:** Segure o botão esquerdo ou do meio do mouse no chão para movimentar a câmera (Pan).
- **Zoom:** Role a roda do mouse (Scroll Wheel).
- **Inspecionar:** Clique em qualquer robô ou edifício no mapa para abrir o painel de diagnóstico na HUD lateral.
- **Despachar Quests:** Clique em **"▶ NOVA QUEST"** na barra superior, selecione o alvo e o robô responsável.
- **Reparo de Erros:** Caso um robô entre em curto-circuito (falha crítica), abra o inspetor lateral e utilize o botão de **Reparo Manual**.
- **Reiniciar Setor:** Clique em **"↺ REINICIAR"** para resetar o banco de dados e restaurar as ruínas do setor para novos testes.
