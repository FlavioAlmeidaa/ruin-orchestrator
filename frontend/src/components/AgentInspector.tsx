import React from "react";
import type { AgentModel, BuildingModel } from "../../../shared/events";

interface AgentInspectorProps {
  agents: AgentModel[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  selectedBuilding: BuildingModel | null;
  onRepairAgent: (id: string) => void;
  onClose: () => void;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  selectedBuilding,
  onRepairAgent,
  onClose,
}) => {
  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "idle":
        return "#4ade80";
      case "walking":
        return "#38bdf8";
      case "working":
        return "#facc15";
      case "error":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "idle":
        return "OCIOSO (STANDBY)";
      case "walking":
        return "DESLOCANDO-SE";
      case "working":
        return "OPERANDO TOOL";
      case "error":
        return "CURTO-CIRCUITO // ERRO";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <aside
      style={{
        position: "fixed",
        top: 80,
        left: 20,
        width: 320,
        background: "rgba(12, 19, 15, 0.95)",
        border: "1px solid #2d4533",
        borderRadius: 4,
        padding: 16,
        color: "#c2d6c5",
        fontFamily: "'Courier New', Courier, monospace",
        zIndex: 15,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", color: "#86efac", letterSpacing: 1 }}>
          // DIAGNÓSTICO DO ESQUADRÃO
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {agents.map((ag) => (
            <button
              key={ag.id}
              onClick={() => onSelectAgent(ag.id)}
              style={{
                padding: "3px 8px",
                fontSize: 10,
                fontFamily: "inherit",
                cursor: "pointer",
                background: ag.id === activeAgent?.id ? "#26422d" : "#131b15",
                color: ag.id === activeAgent?.id ? "#86efac" : "#6b7280",
                border: ag.id === activeAgent?.id ? "1px solid #4ade80" : "1px solid #28362b",
                borderRadius: 2,
              }}
            >
              {ag.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {activeAgent && (
        <div>
          {/* Card do Agente Ativo */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#19241c",
                border: "2px solid #3d5945",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: `0 0 10px ${getStatusColor(activeAgent.status)}40`,
                flexShrink: 0,
              }}
            >
              <img
                src={activeAgent.class === "builder" ? "/assets/hud/portrait_builder.png" : "/assets/agents/robot_scout.png"}
                alt={activeAgent.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  imageRendering: "pixelated",
                  display: "block",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#f0fdf4" }}>{activeAgent.name}</div>
              <div style={{ fontSize: 10, color: "#86efac", textTransform: "uppercase" }}>
                CLASSE: {activeAgent.class} • POS ({activeAgent.pos.x}, {activeAgent.pos.y})
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: getStatusColor(activeAgent.status),
                  marginTop: 2,
                }}
              >
                ● {getStatusLabel(activeAgent.status)}
              </div>
            </div>
          </div>

          {/* Barra de Energia / Bateria (Tokens) */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
              <span style={{ color: "#9ca3af" }}>CÉLULA DE ENERGIA (TOKENS)</span>
              <span style={{ color: "#38bdf8", fontWeight: "bold" }}>
                {activeAgent.energy} / {activeAgent.maxEnergy} PWR
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                background: "#0d140f",
                borderRadius: 2,
                border: "1px solid #1e2e22",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(activeAgent.energy / activeAgent.maxEnergy) * 100}%`,
                  background: "linear-gradient(90deg, #0284c7, #38bdf8)",
                  boxShadow: "0 0 6px #38bdf8",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Módulos Equipados */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>MÓDULOS DE TOOL EQUIPADOS:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {activeAgent.tools.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#162319",
                    border: "1px solid #2c4231",
                    color: "#a7f3d0",
                    fontSize: 9,
                    padding: "2px 6px",
                    borderRadius: 2,
                  }}
                >
                  ⚙ {t}
                </span>
              ))}
            </div>
          </div>

          {/* Alerta de Curto-Circuito / Botão de Reparo */}
          {activeAgent.status === "error" && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                padding: 10,
                borderRadius: 3,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 11, color: "#fca5a5", fontWeight: "bold", marginBottom: 4 }}>
                ⚠️ FALHA DE BARRAMENTO DETECTADA
              </div>
              <div style={{ fontSize: 10, color: "#f87171", marginBottom: 8 }}>
                {activeAgent.errorReason || "Curto-circuito interno durante chamada de ferramenta."}
              </div>
              <button
                onClick={() => onRepairAgent(activeAgent.id)}
                style={{
                  width: "100%",
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: "bold",
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                ⚡ EXECUTAR REPARO MANUAL (+300 PWR)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inspetor de Estrutura Selecionada (se houver) */}
      {selectedBuilding && (
        <div style={{ marginTop: 12, borderTop: "1px dashed #2d4533", paddingTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#facc15", marginBottom: 4 }}>
            ESTRUTURA SELECIONADA: {selectedBuilding.name}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
            ESTADO: <strong style={{ color: selectedBuilding.state === "restored" ? "#4ade80" : selectedBuilding.state === "constructing" ? "#facc15" : "#94a3b8" }}>{selectedBuilding.state.toUpperCase()}</strong>
          </div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>{selectedBuilding.description}</div>
        </div>
      )}
    </aside>
  );
};
