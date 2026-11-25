import type { ClientCommand, WorldEvent } from "../../shared/events";
import * as db from "./db";
import { executeQuestWorkflow, getConfigState, saveConfig } from "./aiEngine";

const WORLD_TOPIC = "sector-01";

// Inicializa banco de dados SQLite persistente
db.initDatabase();

const server = Bun.serve({
  port: 3001,
  async fetch(req, server) {
    if (server.upgrade(req)) return;

    const url = new URL(req.url);

    // Endpoint REST para verificar e atualizar configuração de IA
    if (url.pathname === "/api/config") {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (req.method === "GET") {
        return Response.json(getConfigState(), { headers: corsHeaders });
      }

      if (req.method === "POST") {
        try {
          const body = await req.json();
          const updated = saveConfig(body.geminiApiKey, body.ollamaHost, body.ollamaModel);

          broadcast({
            type: "CONFIG_STATE",
            ...updated,
          });

          const logItem = db.insertLog(
            "SISTEMA",
            `Configurações de IA salvas. Provedor ativo: ${updated.provider}`,
            "success"
          );
          broadcast({
            type: "COMBAT_LOG",
            timestamp: logItem.timestamp,
            source: logItem.source,
            message: logItem.message,
            level: logItem.level,
          });

          return Response.json(updated, { headers: corsHeaders });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }
    }

    return new Response("Ruin Orchestrator WS Engine (SQLite + Vercel AI SDK)", {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
  websocket: {
    open(ws) {
      ws.subscribe(WORLD_TOPIC);

      // Envia snapshot completo do setor carregado do SQLite com config de IA
      const snapshot: WorldEvent = {
        type: "WORLD_SNAPSHOT",
        agents: db.getAgents(),
        buildings: db.getBuildings(),
        sector: db.getSector(),
        logs: db.getRecentLogs(30),
        config: getConfigState(),
      };
      ws.send(JSON.stringify(snapshot));
    },
    async message(_ws, raw) {
      try {
        const cmd: ClientCommand = JSON.parse(String(raw));

        if (cmd.type === "DISPATCH_QUEST") {
          await executeQuestWorkflow(cmd.targetBuildingId, cmd.prompt, cmd.agentId, broadcast);
        } else if (cmd.type === "SAVE_CONFIG") {
          const updated = saveConfig(cmd.geminiApiKey, cmd.ollamaHost, cmd.ollamaModel);
          broadcast({
            type: "CONFIG_STATE",
            ...updated,
          });

          const logItem = db.insertLog(
            "SISTEMA",
            `Configuração de IA atualizada pelo operador. Provedor: ${updated.provider}`,
            "success"
          );
          broadcast({
            type: "COMBAT_LOG",
            timestamp: logItem.timestamp,
            source: logItem.source,
            message: logItem.message,
            level: logItem.level,
          });
        } else if (cmd.type === "REPAIR_AGENT") {
          const agent = db.getAgent(cmd.agentId);
          if (agent) {
            agent.status = "idle";
            agent.errorReason = undefined;
            agent.energy = Math.min(agent.maxEnergy, agent.energy + 300);
            db.updateAgent(agent);

            broadcast({
              type: "AGENT_STATUS",
              agentId: agent.id,
              status: "idle",
            });
            broadcast({
              type: "AGENT_ENERGY_UPDATED",
              agentId: agent.id,
              energy: agent.energy,
              maxEnergy: agent.maxEnergy,
            });

            const logItem = db.insertLog(
              "SISTEMA",
              `Reparo manual concluído no agente ${agent.name}. Barramento reiniciado.`,
              "success"
            );
            broadcast({
              type: "COMBAT_LOG",
              timestamp: logItem.timestamp,
              source: logItem.source,
              message: logItem.message,
              level: logItem.level,
            });
          }
        } else if (cmd.type === "RESET_SECTOR") {
          db.seedInitialData();
          const snapshot: WorldEvent = {
            type: "WORLD_SNAPSHOT",
            agents: db.getAgents(),
            buildings: db.getBuildings(),
            sector: db.getSector(),
            logs: db.getRecentLogs(30),
          };
          broadcast(snapshot);
        }
      } catch (err: any) {
        console.error("Erro ao processar comando recebido:", err);
      }
    },
    close(ws) {
      ws.unsubscribe(WORLD_TOPIC);
    },
  },
});

export function broadcast(event: WorldEvent) {
  server.publish(WORLD_TOPIC, JSON.stringify(event));
}

console.log(`[Ruin Orchestrator] Backend ativo em ws://localhost:${server.port}`);
console.log(`[Ruin Orchestrator] Persistência: SQLite (ruin_orchestrator.sqlite)`);
