import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { AgentModel, BuildingModel, ConfigState, WorldEvent } from "../../shared/events";
import * as db from "./db";

export function getConfigState(): ConfigState {
  const geminiKey = db.getSetting("GEMINI_API_KEY") || process.env.GEMINI_API_KEY || "";
  const hasGeminiKey = Boolean(geminiKey && geminiKey.trim().length > 0);
  const maskedKey = hasGeminiKey
    ? `${geminiKey.substring(0, 6)}...${geminiKey.substring(geminiKey.length - 4)}`
    : "";
  const ollamaHost = db.getSetting("OLLAMA_HOST") || process.env.OLLAMA_HOST || "http://127.0.0.1:11434/v1";
  const ollamaModel = db.getSetting("OLLAMA_MODEL") || process.env.OLLAMA_MODEL || "llama3.2";
  const provider = hasGeminiKey ? "Google Gemini 3.8 Flash" : `Ollama (${ollamaModel})`;

  return {
    hasGeminiKey,
    maskedKey,
    provider,
    ollamaHost,
    ollamaModel,
  };
}

export function saveConfig(
  geminiApiKey?: string,
  ollamaHost?: string,
  ollamaModel?: string
): ConfigState {
  if (geminiApiKey !== undefined) {
    db.setSetting("GEMINI_API_KEY", geminiApiKey.trim());
    process.env.GEMINI_API_KEY = geminiApiKey.trim();
  }
  if (ollamaHost !== undefined) {
    db.setSetting("OLLAMA_HOST", ollamaHost.trim());
    process.env.OLLAMA_HOST = ollamaHost.trim();
  }
  if (ollamaModel !== undefined) {
    db.setSetting("OLLAMA_MODEL", ollamaModel.trim());
    process.env.OLLAMA_MODEL = ollamaModel.trim();
  }

  return getConfigState();
}

// Helper para selecionar o modelo disponível
function getModel() {
  const geminiKey = db.getSetting("GEMINI_API_KEY") || process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 0) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey.trim() });
    return { model: google("gemini-3.8-flash"), providerName: "Google Gemini 3.8 Flash" };
  }

  const ollamaBaseUrl = db.getSetting("OLLAMA_HOST") || process.env.OLLAMA_HOST || "http://127.0.0.1:11434/v1";
  const ollamaModelName = db.getSetting("OLLAMA_MODEL") || process.env.OLLAMA_MODEL || "llama3.2";
  const openaiCompatible = createOpenAI({
    baseURL: ollamaBaseUrl,
    apiKey: "ollama",
  });

  return { model: openaiCompatible(ollamaModelName), providerName: `Ollama (${ollamaModelName})` };
}

// Definição das ferramentas reais (tools) que o LLM pode chamar
export function createAgentTools(
  agent: AgentModel,
  building: BuildingModel,
  emit: (event: WorldEvent) => void
) {
  return {
    diagnose_anomaly: tool({
      description: "Realiza escaneamento diagnóstico na estrutura para detectar falhas elétricas e estruturais.",
      parameters: z.object({
        systemName: z.string().describe("Nome do subsistema a escanear (ex: 'matriz_energetica', 'antena_quantica')"),
        scanDepth: z.enum(["quick", "deep"]).describe("Profundidade do escaneamento"),
      }),
      execute: async ({ systemName, scanDepth }) => {
        emit({
          type: "AGENT_TOOL_CALL",
          agentId: agent.id,
          toolName: `diagnose_anomaly(${systemName})`,
          animation: "scan",
          details: `Varredura ${scanDepth} no subsistema ${systemName}`,
        });

        // Consumo de energia / tokens
        consumeEnergy(agent, 45, emit);

        await Bun.sleep(1500);

        const logMsg = `Sensor de varredura acionado em ${systemName}: Anomalias detectadas. Integridade em 18%. Requer solda de condutores.`;
        logEvent(agent.name, logMsg, "info", emit);

        return {
          status: "anomaly_confirmed",
          integrity: 18,
          criticalParts: ["condutores_primarios", "bobina_resonante"],
          recommendation: "Executar síntese de nanoliga e soldagem de reforço.",
        };
      },
    }),

    synthesize_alloy: tool({
      description: "Sintetiza materiais de reposição e ligas metálicas resistentes à radiação e umidade.",
      parameters: z.object({
        materialType: z.string().describe("Tipo do material a fabricar (ex: 'nanoliga_titanio', 'resina_polimera')"),
        amountUnits: z.number().describe("Quantidade em unidades"),
      }),
      execute: async ({ materialType, amountUnits }) => {
        emit({
          type: "AGENT_TOOL_CALL",
          agentId: agent.id,
          toolName: `synthesize_alloy(${materialType})`,
          animation: "transmitting",
          details: `Fabricando ${amountUnits}x de ${materialType}`,
        });

        consumeEnergy(agent, 60, emit);
        await Bun.sleep(1800);

        const logMsg = `Síntese concluída: ${amountUnits} unidades de ${materialType} prontas para aplicação.`;
        logEvent(agent.name, logMsg, "info", emit);

        return { success: true, material: materialType, yield: amountUnits };
      },
    }),

    weld_framework: tool({
      description: "Aplica solda de precisão e reconstrói as vigas ou circuitos da estrutura.",
      parameters: z.object({
        component: z.string().describe("Componente a ser soldado"),
        temperatureKelvin: z.number().describe("Temperatura do feixe de plasma"),
      }),
      execute: async ({ component, temperatureKelvin }) => {
        emit({
          type: "AGENT_TOOL_CALL",
          agentId: agent.id,
          toolName: `weld_framework(${component})`,
          animation: "weld",
          details: `Soldando ${component} a ${temperatureKelvin}K`,
        });

        consumeEnergy(agent, 80, emit);
        await Bun.sleep(2200);

        const logMsg = `Solda de plasma concluída em ${component}. Estrutura reforçada.`;
        logEvent(agent.name, logMsg, "success", emit);

        return { success: true, component, status: "reinforced" };
      },
    }),

    verify_subsystems: tool({
      description: "Testa a ativação final do sistema restaurado.",
      parameters: z.object({
        subsystem: z.string().describe("Subsistema para teste de partida"),
      }),
      execute: async ({ subsystem }) => {
        emit({
          type: "AGENT_TOOL_CALL",
          agentId: agent.id,
          toolName: `verify_subsystems(${subsystem})`,
          animation: "scan",
          details: `Testando resposta de frequência em ${subsystem}`,
        });

        consumeEnergy(agent, 30, emit);
        await Bun.sleep(1200);

        const logMsg = `Subsistema ${subsystem} respondeu com código de integridade 0x90 (ONLINE).`;
        logEvent(agent.name, logMsg, "success", emit);

        return { status: "ONLINE", checksum: "0x90-VERIFIED" };
      },
    }),
  };
}

function consumeEnergy(agent: AgentModel, amount: number, emit: (event: WorldEvent) => void) {
  agent.energy = Math.max(0, agent.energy - amount);
  db.updateAgent({ id: agent.id, energy: agent.energy });
  emit({
    type: "AGENT_ENERGY_UPDATED",
    agentId: agent.id,
    energy: agent.energy,
    maxEnergy: agent.maxEnergy,
  });
}

function logEvent(
  source: string,
  message: string,
  level: "info" | "warn" | "error" | "success",
  emit: (event: WorldEvent) => void
) {
  const logItem = db.insertLog(source, message, level);
  emit({
    type: "COMBAT_LOG",
    timestamp: logItem.timestamp,
    source: logItem.source,
    message: logItem.message,
    level: logItem.level,
  });
}

// Orquestração da Quest: Movimentação -> Análise -> Execução com LLM -> Restauração
export async function executeQuestWorkflow(
  targetBuildingId: string,
  prompt: string,
  assignedAgentId: string | undefined,
  emit: (event: WorldEvent) => void
) {
  const building = db.getBuilding(targetBuildingId);
  if (!building) {
    logEvent("SISTEMA", `Edifício ${targetBuildingId} não encontrado.`, "error", emit);
    return;
  }

  const agents = db.getAgents();
  const agent = (assignedAgentId ? agents.find((a) => a.id === assignedAgentId) : null) || agents[0];
  if (!agent) {
    logEvent("SISTEMA", "Nenhum agente disponível no setor.", "error", emit);
    return;
  }

  if (agent.status === "error") {
    logEvent(
      "SISTEMA",
      `Agente ${agent.name} está em curto-circuito! Execute o reparo manual antes de despachar.`,
      "error",
      emit
    );
    return;
  }

  logEvent(
    agent.name,
    `Quest recebida: "${prompt}". Iniciando deslocamento até ${building.name} (${building.pos.x}, ${building.pos.y}).`,
    "info",
    emit
  );

  // 1. Atualiza status para caminhando e move o robô em coordenadas vizinhas
  agent.status = "walking";
  db.updateAgent({ id: agent.id, status: "walking" });
  emit({ type: "AGENT_STATUS", agentId: agent.id, status: "walking" });

  const targetCoord = {
    x: Math.max(0, building.pos.x - (building.pos.x > 0 ? 1 : 0)),
    y: building.pos.y,
  };

  // Traça caminho passo a passo para movimentação suave
  const path = calculatePath(agent.pos, targetCoord);
  for (const step of path) {
    agent.pos = step;
    db.updateAgent({ id: agent.id, pos: agent.pos });
    emit({ type: "AGENT_MOVED", agentId: agent.id, target: step, path });
    await Bun.sleep(400);
  }

  // 2. Chegou na estrutura: marca como em construção
  agent.status = "working";
  db.updateAgent({ id: agent.id, status: "working" });
  emit({ type: "AGENT_STATUS", agentId: agent.id, status: "working" });

  building.state = "constructing";
  db.updateBuildingState(building.id, "constructing");
  emit({ type: "BUILDING_PROGRESS", buildingId: building.id, state: "constructing" });
  emit({ type: "SECTOR_PROGRESS", restorationPercentage: db.getSector().restorationPercentage });

  // 3. Execução do modelo de IA (com fallback inteligente)
  const tools = createAgentTools(agent, building, emit);
  const systemPrompt = `Você é ${agent.name}, um autômato de restauração classe ${agent.class} operando em um mundo pós-apocalíptico.
Sua missão atual é restaurar a estrutura "${building.name}" (${building.description}).
Você possui ferramentas de diagnóstico, síntese de materiais e soldagem.
Utilize suas ferramentas passo a passo para inspecionar, preparar materiais, efetuar os reparos e verificar os subsistemas.
Mantenha suas mensagens concisas no estilo rádio militar / robô industrial retrofuturista.`;

  try {
    const { model, providerName } = getModel();
    logEvent("SISTEMA", `Acionando motor cognitivo: ${providerName}`, "info", emit);

    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: `Inicie a restauração da estrutura ${building.name}. Instrução do operador: ${prompt}`,
        tools,
        maxSteps: 5,
      });

      logEvent(agent.name, result.text || `Operações de campo concluídas em ${building.name}.`, "success", emit);
    } catch (llmError: any) {
      logEvent(
        "SISTEMA",
        `Provedor externo inacessível (${llmError.message || "Conexão recusada"}). Ativando protocolo autônomo local.`,
        "warn",
        emit
      );

      // Simulação estruturada com Tool Calling real local caso a API esteja sem chave / offline
      await runSimulatedWorkflow(agent, building, tools, emit);
    }

    // 4. Conclusão da Restauração
    building.state = "restored";
    db.updateBuildingState(building.id, "restored");
    emit({ type: "BUILDING_PROGRESS", buildingId: building.id, state: "restored" });
    emit({ type: "SECTOR_PROGRESS", restorationPercentage: db.getSector().restorationPercentage });

    agent.status = "idle";
    db.updateAgent({ id: agent.id, status: "idle" });
    emit({ type: "AGENT_STATUS", agentId: agent.id, status: "idle" });

    logEvent(agent.name, `Estrutura [${building.name}] restaurada com 100% de sucesso. Energia setor atualizada.`, "success", emit);
  } catch (criticalError: any) {
    // Curto-circuito no robô
    agent.status = "error";
    agent.errorReason = criticalError.message || "Falha crítica de barramento.";
    db.updateAgent({ id: agent.id, status: "error", errorReason: agent.errorReason });
    emit({ type: "AGENT_STATUS", agentId: agent.id, status: "error", errorReason: agent.errorReason });
    emit({
      type: "AGENT_TOOL_CALL",
      agentId: agent.id,
      toolName: "emergency_cutoff",
      animation: "spark",
      details: "Curto-circuito! Robô necessita intervenção manual.",
    });

    logEvent(agent.name, `[ALERTA CRÍTICO] Curto-circuito elétrico: ${agent.errorReason}`, "error", emit);
  }
}

// Fallback de alta fidelidade para rodar sem dependência de internet ou chaves de API
async function runSimulatedWorkflow(
  agent: AgentModel,
  building: BuildingModel,
  tools: ReturnType<typeof createAgentTools>,
  emit: (event: WorldEvent) => void
) {
  logEvent(agent.name, `[PROTOCOLO AUTÔNOMO] Iniciando diagnóstico de hardware em ${building.name}...`, "info", emit);
  await (tools.diagnose_anomaly.execute as any)({
    systemName: "matriz_primaria",
    scanDepth: "deep",
  });

  logEvent(agent.name, "[PROTOCOLO AUTÔNOMO] Forjando compostos estruturais de nanoliga...", "info", emit);
  await (tools.synthesize_alloy.execute as any)({
    materialType: "nanoliga_reforcada",
    amountUnits: 4,
  });

  logEvent(agent.name, "[PROTOCOLO AUTÔNOMO] Iniciando solda nos feixes de ancoragem...", "info", emit);
  await (tools.weld_framework.execute as any)({
    component: "vigas_de_sustentacao",
    temperatureKelvin: 2800,
  });

  logEvent(agent.name, "[PROTOCOLO AUTÔNOMO] Verificando subsistema restaurado...", "info", emit);
  await (tools.verify_subsystems.execute as any)({
    subsystem: "gerador_principal",
  });
}

function calculatePath(from: { x: number; y: number }, to: { x: number; y: number }): Array<{ x: number; y: number }> {
  const steps: Array<{ x: number; y: number }> = [];
  let currX = from.x;
  let currY = from.y;

  while (currX !== to.x || currY !== to.y) {
    if (currX < to.x) currX++;
    else if (currX > to.x) currX--;
    else if (currY < to.y) currY++;
    else if (currY > to.y) currY--;

    steps.push({ x: currX, y: currY });
  }

  return steps;
}
